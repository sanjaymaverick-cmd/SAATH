import test from 'node:test'
import assert from 'node:assert/strict'
import { generateTemporaryPassword, hashPassword, normalizeLogin, validateLogin, validatePassword, verifyPassword } from './auth.js'

test('login IDs are normalized and constrained', () => {
  assert.equal(normalizeLogin('  Family.Member  '), 'family.member')
  assert.equal(validateLogin('Family-Member_1'), 'family-member_1')
  assert.throws(() => validateLogin('ab'))
  assert.throws(() => validateLogin('family member'))
})

test('password hashes verify without storing plaintext', async () => {
  const record = await hashPassword('orange-gold-2026')
  assert.equal(record.algorithm, 'scrypt')
  assert.equal(JSON.stringify(record).includes('orange-gold-2026'), false)
  assert.equal(await verifyPassword('orange-gold-2026', record), true)
  assert.equal(await verifyPassword('wrong-password', record), false)
  assert.throws(() => validatePassword('short'))
})

test('temporary passwords satisfy the password policy', () => {
  const password = generateTemporaryPassword()
  assert.ok(password.length >= 10)
  assert.equal(validatePassword(password), password)
})

