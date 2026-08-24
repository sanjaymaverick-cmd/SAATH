import fs from 'node:fs'
import { generateTemporaryPassword, hashPassword } from './auth.js'

const dbFile = '/data/db.json'
const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'))
const owner = db.users.find(user => user.login === 'owner' && user.admin === true)
if (!owner) throw new Error('Production owner account not found')

const temporaryPassword = generateTemporaryPassword()
owner.password = await hashPassword(temporaryPassword)
owner.mustChangePassword = true
owner.sv = (owner.sv || 0) + 1

const tmp = dbFile + '.tmp'
fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 })
fs.renameSync(tmp, dbFile)
console.log(`Login ID: owner\nTemporary password: ${temporaryPassword}\nChange it on first sign-in.`)
