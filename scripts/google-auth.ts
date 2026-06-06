

import { google } from "googleapis"
import readline from "readline"
import fs from "fs"

import credentials from "../credentials.json" 


const {
  client_secret,
  client_id,
  redirect_uris
} = credentials.installed

const oAuth2Client =
  new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.send"
]

const authUrl =
  oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  })

console.log("\nOPEN THIS URL:\n")
console.log(authUrl)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question("\nPASTE CODE HERE: ", async (code) => {

  const { tokens } =
    await oAuth2Client.getToken(code)

  fs.writeFileSync(
    "token.json",
    JSON.stringify(tokens)
  )

  console.log("\nTOKEN SAVED.\n")

  rl.close()
})

