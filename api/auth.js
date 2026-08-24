import crypto from 'node:crypto'

const KEY_BYTES = 64
const MIN_PASSWORD = 10

export function normalizeLogin(value) {
  return String(value || '').trim().toLowerCase()
}

export function validateLogin(value) {
  const login = normalizeLogin(value)
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(login)) {
    throw new Error('login ID must be 3–32 letters, numbers, dots, dashes or underscores')
  }
  return login
}

export function validatePassword(value) {
  const password = String(value || '')
  if (password.length < MIN_PASSWORD) throw new Error(`password must be at least ${MIN_PASSWORD} characters`)
  if (password.length > 128) throw new Error('password is too long')
  return password
}

const scrypt = (password, salt) => new Promise((resolve, reject) => {
  crypto.scrypt(password, salt, KEY_BYTES, (error, key) => error ? reject(error) : resolve(key))
})

export async function hashPassword(value) {
  const password = validatePassword(value)
  const salt = crypto.randomBytes(24).toString('base64url')
  const key = await scrypt(password, salt)
  return { algorithm: 'scrypt', salt, hash: key.toString('base64url') }
}

export async function verifyPassword(value, record) {
  if (!record || record.algorithm !== 'scrypt' || !record.salt || !record.hash) return false
  const key = await scrypt(String(value || ''), record.salt)
  const expected = Buffer.from(record.hash, 'base64url')
  return expected.length === key.length && crypto.timingSafeEqual(expected, key)
}

export function generateTemporaryPassword() {
  // 18 random base64url characters: easy to transfer once, with about 108 bits of entropy.
  return crypto.randomBytes(14).toString('base64url')
}

