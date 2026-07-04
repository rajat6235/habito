import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  hashToken,
  generateSecureToken,
  safeCompare,
} from '../utils/crypto';

describe('hashPassword / verifyPassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const pw   = 'MyStr0ngPassword!';
    const hash = await hashPassword(pw);

    expect(hash).not.toBe(pw);
    expect(hash).toMatch(/^\$argon2id\$/);

    await expect(verifyPassword(hash, pw)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('correct-horse');
    await expect(verifyPassword(hash, 'wrong-battery')).resolves.toBe(false);
  });

  it('produces unique hashes for the same password', async () => {
    const [h1, h2] = await Promise.all([
      hashPassword('same'),
      hashPassword('same'),
    ]);
    expect(h1).not.toBe(h2);
  });
});

describe('hashToken', () => {
  it('returns a 64-char hex string', () => {
    const h = hashToken('some-raw-token');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', () => {
    expect(hashToken('abc')).toBe(hashToken('abc'));
  });

  it('differs for different inputs', () => {
    expect(hashToken('a')).not.toBe(hashToken('b'));
  });
});

describe('generateSecureToken', () => {
  it('returns 64 hex chars by default (32 bytes)', () => {
    expect(generateSecureToken()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns 32 hex chars for 16 bytes', () => {
    expect(generateSecureToken(16)).toMatch(/^[0-9a-f]{32}$/);
  });

  it('generates unique tokens', () => {
    const [t1, t2] = [generateSecureToken(), generateSecureToken()];
    expect(t1).not.toBe(t2);
  });
});

describe('safeCompare', () => {
  it('returns true for identical strings', () => {
    expect(safeCompare('hello', 'hello')).toBe(true);
  });

  it('returns false for different strings of the same length', () => {
    expect(safeCompare('aaaaa', 'baaaa')).toBe(false);
  });

  it('returns false when lengths differ', () => {
    expect(safeCompare('short', 'longer-string')).toBe(false);
  });
});
