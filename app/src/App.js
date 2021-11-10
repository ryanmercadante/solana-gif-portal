import twitterLogo from './assets/twitter-logo.svg'
import './App.css'
import { TEST_GIFS, TWITTER_HANDLE, TWITTER_LINK } from './utils/constants'
import { useEffect, useState } from 'react'

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [gifList, setGifList] = useState([])

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

  async function sendGif() {
    if (inputValue.length > 0) {
      console.log('Gif link:', inputValue)
    } else {
      console.log('Empty input. Try again.')
    }
  }

  const renderNotConnectedContainer = () => (
    <button
      className='cta-button connect-wallet-button'
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  )

  const renderConnectedContainer = () => (
    <div className='connected-container'>
      <input
        type='text'
        value={inputValue}
        placeholder='Enter gif link!'
        onChange={handleInputChange}
      />
      <button className='cta-button submit-gif-button' onClick={sendGif}>
        Submit
      </button>
      <div className='gif-grid'>
        {gifList.map((gif) => (
          <div className='gif-item' key={gif}>
            <img src={gif} alt={gif} />
          </div>
        ))}
      </div>
    </div>
  )

  useEffect(() => {
    window.addEventListener('load', checkIfWalletConnected)

    return () => {
      window.removeEventListener('load', checkIfWalletConnected)
    }
  }, [])

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...')

      // Call Solana program here.

      // Set state
      setGifList(TEST_GIFS)
    }
  }, [walletAddress])

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
