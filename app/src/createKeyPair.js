const fs = require('fs')
const anchor = require('@project-serum/anchor')

const account = anchor.web3.Keypair.generate()

const buff = Buffer.from(JSON.stringify(account), 'utf-8')

const base64 = buff.toString('base64')

const envVar = 'REACT_APP_BASE64_KEYPAIR=' + base64
fs.writeFileSync('../.env', envVar)
