const fs = require('fs')
const anchor = require('@project-serum/anchor')
const { encode } = require('base-64')

const account = anchor.web3.Keypair.generate()

let encoded = encode(JSON.stringify(account))
const envVar = 'NEXT_PUBLIC_BASE64_KEYPAIR=' + encoded

fs.writeFileSync('./.env', envVar)
