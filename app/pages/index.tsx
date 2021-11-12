import React, { useCallback, useEffect, useState } from 'react'
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  Commitment,
} from '@solana/web3.js'
import { Idl, Program, Provider, web3 } from '@project-serum/anchor'
import { decode } from 'base-64'
import { TWITTER_HANDLE, TWITTER_LINK } from '../utils/constants'
import idl from '../idl.json'
import styles from '../styles/Home.module.css'

// SystemProgram is a reference to the Solana runtime.
const { SystemProgram } = web3

// Decode base64 keypair and generate baseAccount from it.
let decoded = decode(process.env.NEXT_PUBLIC_BASE64_KEYPAIR as string)
const json = JSON.parse(decoded)
const arr = Object.values(json._keypair.secretKey)
const secret = new Uint8Array(arr as unknown as number)
const baseAccount = web3.Keypair.fromSecretKey(secret)

// Get our program's id from the IDL file.
const programId = new PublicKey(idl.metadata.address)

// Set our network to devnet.
const network = clusterApiUrl('devnet')

// Control's how we want to achknowledge when a transaction is "done."
const preflightCommitment: Commitment = 'processed'

interface Gif {
  gifLink: string
  userAddress: string
}

function Home({}) {
  const [walletAddress, setWalletAddress] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState<Gif[] | null>(null)

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

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value)
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendGif()
  }

  function getProvider() {
    const connection = new Connection(network, preflightCommitment)
    const provider = new Provider(connection, window.solana, {
      preflightCommitment,
    })
    return provider
  }

  const createGifAccount = async () => {
    const provider = getProvider()
    const program = new Program(idl as Idl, programId, provider)
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

    const provider = getProvider()
    const program = new Program(idl as Idl, programId, provider)
    try {
      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      })
      await getGifList()
      setInputValue('')
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
    const program = new Program(idl as Idl, programId, provider)

    try {
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      )
      setGifList(account.gifList)
    } catch (err) {
      console.log('Error in getGifs:', err)
      setGifList(null)
    }
  }, [])

  const renderNotConnectedContainer = () => (
    <button
      className={`${styles.ctaButton} ${styles.connectWalletButton}`}
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  )

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't been initialized.
    if (gifList === null) {
      return (
        <div className={styles.connectContainer}>
          <button
            className={`${styles.ctaButton} ${styles.submitGifButton}`}
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    }

    // Otherwise, account exists. user can submit GIFs.
    return (
      <div className={styles.connectedContainer}>
        <form onSubmit={handleFormSubmit}>
          <input
            type='text'
            placeholder='Enter gif link!'
            value={inputValue}
            onChange={handleInputChange}
          />
          <button
            type='submit'
            className={`${styles.ctaButton} ${styles.submitGifButton}`}
          >
            Submit
          </button>
        </form>
        <div className={styles.gifGrid}>
          {gifList.map((item, index) => (
            <div className={styles.gifItem} key={index}>
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

  useEffect(() => {
    if (walletAddress) {
      getGifList()
    }
  }, [getGifList, walletAddress])

  return (
    <div className={styles.app}>
      <div
        className={walletAddress ? styles.authedContainer : styles.container}
      >
        <div className={styles.headerContainer}>
          <p className={styles.header}>🖼 GIF Portal</p>
          <p className={styles.subText}>
            View your GIF collection in the metaverse ✨
          </p>
          {walletAddress
            ? renderConnectedContainer()
            : renderNotConnectedContainer()}
        </div>
        <div className={styles.footerContainer}>
          <img
            alt='Twitter Logo'
            className={styles.twitterLogo}
            src='/twitter-logo.svg'
          />
          <a
            className={styles.footerText}
            href={TWITTER_LINK}
            target='_blank'
            rel='noreferrer'
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  )
}

export default Home
