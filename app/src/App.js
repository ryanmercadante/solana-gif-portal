import { useCallback, useEffect, useState } from 'react'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { Program, Provider, web3 } from '@project-serum/anchor'
import { TWITTER_HANDLE, TWITTER_LINK } from './utils/constants'
import twitterLogo from './assets/twitter-logo.svg'
import idl from './idl.json'
import './App.css'

// SystemProgram is a reference to the Solana runtime.
const { SystemProgram, Keypair } = web3

// Create a keypair for the account that will hold the GIF data.
const baseAccount = Keypair.generate()

// Get our program's id from the IDL file.
const programId = new PublicKey(idl.metadata.address)

// Set our network to devnet.
const network = clusterApiUrl('devnet')

// Control's how we want to achknowledge when a transaction is "done."
const opts = { preflightCommitment: 'processed' }

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState(null)

  async function checkIfWalletConnected() {
    const { solana } = window

    if (!solana && !solana.isPhantom)
      alert('Solana object not found! Get a Phantom Wallet 👻')

    console.log('Phantom wallet found!')

    try {
      const response = await solana.connect({ onlyIfTrusted: true })
      console.log('Connected with Public Key:', response.publicKey.toString())
      setWalletAddress(response.publicKey.toString())
    } catch (err) {
      console.error(err)
    }
  }

  async function connectWallet() {
    const { solana } = window

    if (solana) {
      const response = await solana.connect()
      console.log('Connected with Public Key:', response.publicKey.toString())
      setWalletAddress(response.publicKey.toString())
    }
  }

  function handleInputChange(e) {
    setInputValue(e.target.value)
  }

  function handleFormSubmit(e) {
    e.preventDefault()
    sendGif()
  }

  function getProvider() {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new Provider(
      connection,
      window.solana,
      opts.preflightCommitment
    )
    return provider
  }

  const createGifAccount = async () => {
    const provider = getProvider()
    const program = new Program(idl, programId, provider)
    console.log('ping')

    try {
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      })

      console.log(
        'Created a new BaseAccount w/ address:',
        baseAccount.publicKey.toString()
      )
      await getGifList()
    } catch (error) {
      console.log('Error creating BaseAccount account:', error)
    }
  }

  async function sendGif() {
    if (inputValue.length === 0) {
      console.log('No gif link given!')
      return
    }
    console.log('Gif link:', inputValue)

    const provider = getProvider()
    const program = new Program(idl, programId, provider)
    try {
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      })
      console.log('GIF sucesfully sent to program', inputValue)
      await getGifList()
    } catch (err) {
      console.log('Error sending gif:', err)
    }

    if (inputValue.length > 0) {
    } else {
      console.log('Empty input. Try again.')
    }
  }

  const getGifList = useCallback(async () => {
    const provider = getProvider()
    const program = new Program(idl, programId, provider)

    try {
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      )
      console.log('Got the account:', account)
      setGifList(account.gifList)
    } catch (err) {
      console.log('Error in getGifs:', err)
      setGifList(null)
    }
  }, [])

  const renderNotConnectedContainer = () => (
    <button
      className='cta-button connect-wallet-button'
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  )

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
    if (gifList === null) {
      return (
        <div className='connected-container'>
          <button
            className='cta-button submit-gif-button'
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }

    // Otherwise, account exists. user can submit GIFs.
    return (
      <div className='connected-container'>
        <form onSubmit={handleFormSubmit}>
          <input
            type='text'
            placeholder='Enter gif link!'
            value={inputValue}
            onChange={handleInputChange}
          />
          <button type='submit' className='cta-button submit-gif-button'>
            Submit
          </button>
        </form>
        <div className='gif-grid'>
          {gifList.map((item, index) => (
            <div className='gif-item' key={index}>
              <img src={item.gifLink} alt={item.gifLink} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  useEffect(() => {
    window.addEventListener('load', checkIfWalletConnected)

    return () => {
      window.removeEventListener('load', checkIfWalletConnected)
    }
  }, [])

  return (
    <div className='App'>
      <div className={walletAddress ? 'authed-container' : 'container'}>
        <div className='header-container'>
          <p className='header'>🖼 GIF Portal</p>
          <p className='sub-text'>
            View your GIF collection in the metaverse ✨
          </p>
          {walletAddress
            ? renderConnectedContainer()
            : renderNotConnectedContainer()}
        </div>
        <div className='footer-container'>
          <img alt='Twitter Logo' className='twitter-logo' src={twitterLogo} />
          <a
            className='footer-text'
            href={TWITTER_LINK}
            target='_blank'
            rel='noreferrer'
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default App
