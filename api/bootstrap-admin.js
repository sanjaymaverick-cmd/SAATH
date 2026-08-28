import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { generateTemporaryPassword, hashPassword, validateLogin } from './auth.js'

const args = Object.fromEntries(process.argv.slice(2).map((arg, index, all) =>
  arg.startsWith('--') ? [arg.slice(2), all[index + 1]?.startsWith('--') ? '' : all[index + 1]] : null
).filter(Boolean))
const DATA = process.env.DATA_DIR || path.resolve('data')
const login = validateLogin(args.login || 'admin')
const name = String(args.name || 'Family Admin').trim().slice(0, 40)
const dbFile = path.join(DATA, 'db.json')
fs.mkdirSync(DATA, { recursive: true })
let db = { users: [], creds: [], subs: [], invites: [] }
try { db = JSON.parse(fs.readFileSync(dbFile, 'utf8')) } catch {}
db.users ||= []
if (db.users.some(user => user.login === login)) throw new Error(`login ID “${login}” already exists`)
const temporaryPassword = generateTemporaryPassword()
db.users.push({
  id: crypto.randomBytes(12).toString('base64url'), name, login,
  password: await hashPassword(temporaryPassword), mustChangePassword: true,
  admin: true, created: new Date().toISOString(), sv: 0
})
const tmp = dbFile + '.tmp'
fs.writeFileSync(tmp, JSON.stringify(db, null, 2), { mode: 0o600 })
fs.renameSync(tmp, dbFile)
console.log(`SAATH administrator created\nLogin ID: ${login}\nTemporary password: ${temporaryPassword}\nChange it on first sign-in.`)
