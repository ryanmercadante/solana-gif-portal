const anchor = require('@project-serum/anchor')
const { SystemProgram } = require('@solana/web3.js')

const main = async () => {
  console.log('🚀 Starting test...')

  // Create and set the provider. We set it before but we needed to update it, so that it can communicate with our frontend!
  const provider = anchor.Provider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Myepicproject

  // Create an account keypair for our program to use.
  const baseAccount = anchor.web3.Keypair.generate()

  // Call start_stuff_off, pass it the params it needs!
  let tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  })

  console.log('📝 Your transaction signature', tx)

  // Fetch data from the account.
  let account = await program.account.baseAccount.fetch(baseAccount.publicKey)
  console.log('👀 GIF Count', account.totalGifs.toString())

  // Call add_gif!
  await program.rpc.addGif(
    'https://media.giphy.com/media/wkW0maGDN1eSc/giphy.gif',
    {
      accounts: {
        baseAccount: baseAccount.publicKey,
        user: provider.wallet.publicKey,
      },
    }
  )

  // Get the account again to see what changed.
  account = await program.account.baseAccount.fetch(baseAccount.publicKey)
  console.log('👀 GIF Count', account.totalGifs.toString())

  // Access gif_list on the account!
  console.log('👀 GIF List', account.gifList)
}

const runMain = async () => {
  try {
    await main()
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

runMain()
