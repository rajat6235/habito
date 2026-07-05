import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/auth.service';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../config/database', () => ({
  prisma: {
    role: {
      findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'role-user-id', name: 'user' }),
    },
    emailVerificationToken: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((ops: unknown[]) => Promise.all(ops)),
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id:            'user-id-1',
    email:         'alice@example.com',
    username:      'alice',
    passwordHash:  '$argon2id$v=19$m=65536,t=3,p=4$salt$hash', // not real, overridden in login tests
    firstName:     'Alice',
    lastName:      null,
    avatarUrl:     null,
    emailVerified: true,
    status:        'active',
    roles:         [{ role: { name: 'user' } }],
    ...overrides,
  };
}

function makeUserRepo(overrides: Record<string, unknown> = {}) {
  return {
    findByEmail:        vi.fn().mockResolvedValue(null),
    findByUsername:     vi.fn().mockResolvedValue(null),
    findById:           vi.fn(),
    findByIdWithRoles:  vi.fn(),
    create:             vi.fn().mockResolvedValue(makeUser()),
    updateLastLogin:    vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeSessionRepo() {
  return {
    createSession:      vi.fn().mockResolvedValue({ id: 'session-id-1' }),
    createRefreshToken: vi.fn().mockResolvedValue({}),
    findRefreshToken:   vi.fn(),
    rotateRefreshToken: vi.fn(),
    touchSession:       vi.fn(),
    deleteSession:      vi.fn(),
    deleteAllUserSessions: vi.fn(),
    findByUserId:       vi.fn().mockResolvedValue([]),
    deleteById:         vi.fn(),
  };
}

// ── register() ───────────────────────────────────────────────────────────────

describe('AuthService.register()', () => {
  const validPayload = {
    email:     'alice@example.com',
    password:  'Str0ng!Pass',
    firstName: 'Alice',
    username:  'alice',
  };

  it('throws CONFLICT when email already exists', async () => {
    const userRepo = makeUserRepo({
      findByEmail: vi.fn().mockResolvedValue(makeUser()),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    await expect(svc.register(validPayload)).rejects.toMatchObject({
      code: ErrorCode.EMAIL_ALREADY_EXISTS,
      statusCode: 409,
    });
  });

  it('throws CONFLICT when username already exists', async () => {
    const userRepo = makeUserRepo({
      findByUsername: vi.fn().mockResolvedValue(makeUser()),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    await expect(svc.register(validPayload)).rejects.toMatchObject({
      code: ErrorCode.USERNAME_ALREADY_EXISTS,
      statusCode: 409,
    });
  });

  it('returns userId on success', async () => {
    const userRepo = makeUserRepo({
      create: vi.fn().mockResolvedValue(makeUser({ id: 'new-user-id' })),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    const result = await svc.register(validPayload);

    expect(result).toHaveProperty('userId', 'new-user-id');
  });

  it('normalises email to lowercase before duplicate check', async () => {
    const userRepo = makeUserRepo();
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    await svc.register({ ...validPayload, email: 'ALICE@EXAMPLE.COM' });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('alice@example.com');
  });

  it('calls userRepo.create exactly once on success', async () => {
    const userRepo = makeUserRepo();
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    await svc.register(validPayload);

    expect(userRepo.create).toHaveBeenCalledTimes(1);
  });
});

// ── login() ───────────────────────────────────────────────────────────────────

describe('AuthService.login()', () => {
  // Use the real hashPassword to produce a hash the real verifyPassword can check
  let realHash: string;

  beforeEach(async () => {
    const { hashPassword } = await import('../utils/crypto');
    realHash = await hashPassword('correct-password');
  });

  const loginPayload = {
    email:      'alice@example.com',
    password:   'correct-password',
    rememberMe: false,
  };

  it('throws INVALID_CREDENTIALS when user not found', async () => {
    const userRepo = makeUserRepo({
      findByEmail:       vi.fn().mockResolvedValue(null),
      findByIdWithRoles: vi.fn().mockResolvedValue(null),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    await expect(svc.login(loginPayload)).rejects.toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
      statusCode: 401,
    });
  });

  it('throws ACCOUNT_DISABLED when user is disabled', async () => {
    const user = makeUser({ status: 'disabled' });
    const userRepo = makeUserRepo({
      findByEmail:       vi.fn().mockResolvedValue(user),
      findByIdWithRoles: vi.fn().mockResolvedValue(user),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    await expect(svc.login(loginPayload)).rejects.toMatchObject({
      code: ErrorCode.ACCOUNT_DISABLED,
      statusCode: 403,
    });
  });

  it('throws INVALID_CREDENTIALS for deleted accounts (no enumeration)', async () => {
    const user = makeUser({ status: 'deleted' });
    const userRepo = makeUserRepo({
      findByEmail:       vi.fn().mockResolvedValue(user),
      findByIdWithRoles: vi.fn().mockResolvedValue(user),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    await expect(svc.login(loginPayload)).rejects.toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
    });
  });

  it('throws INVALID_CREDENTIALS on wrong password', async () => {
    const user = makeUser({ passwordHash: realHash });
    const userRepo = makeUserRepo({
      findByEmail:       vi.fn().mockResolvedValue(user),
      findByIdWithRoles: vi.fn().mockResolvedValue(user),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    await expect(svc.login({ ...loginPayload, password: 'wrong-password' })).rejects.toMatchObject({
      code: ErrorCode.INVALID_CREDENTIALS,
    });
  });

  it('throws EMAIL_NOT_VERIFIED when email not verified', async () => {
    const user = makeUser({ passwordHash: realHash, emailVerified: false });
    const userRepo = makeUserRepo({
      findByEmail:       vi.fn().mockResolvedValue(user),
      findByIdWithRoles: vi.fn().mockResolvedValue(user),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    await expect(svc.login(loginPayload)).rejects.toMatchObject({
      code: ErrorCode.EMAIL_NOT_VERIFIED,
      statusCode: 403,
    });
  });

  it('returns accessToken, refreshToken, expiresIn, and user on success', async () => {
    const user = makeUser({ passwordHash: realHash });
    const userRepo = makeUserRepo({
      findByEmail:       vi.fn().mockResolvedValue(user),
      findByIdWithRoles: vi.fn().mockResolvedValue(user),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    const result = await svc.login(loginPayload);

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(typeof result.accessToken).toBe('string');
    expect(result.user.email).toBe('alice@example.com');
    expect(result.sessionId).toBe('session-id-1');
  });
});

// ── requestPasswordReset() ───────────────────────────────────────────────────

describe('AuthService.requestPasswordReset()', () => {
  it('returns null when user does not exist (prevents email enumeration)', async () => {
    const userRepo = makeUserRepo({ findByEmail: vi.fn().mockResolvedValue(null) });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    const result = await svc.requestPasswordReset('nobody@example.com');
    expect(result).toBeNull();
  });

  it('returns null for deleted accounts', async () => {
    const userRepo = makeUserRepo({
      findByEmail: vi.fn().mockResolvedValue(makeUser({ status: 'deleted' })),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    const result = await svc.requestPasswordReset('alice@example.com');
    expect(result).toBeNull();
  });

  it('returns a token and firstName on success', async () => {
    const userRepo = makeUserRepo({
      findByEmail: vi.fn().mockResolvedValue(makeUser()),
    });
    const svc = new AuthService(userRepo as never, makeSessionRepo() as never);

    const result = await svc.requestPasswordReset('alice@example.com');

    expect(result).not.toBeNull();
    expect(result?.firstName).toBe('Alice');
    expect(typeof result?.token).toBe('string');
    expect(result!.token.length).toBeGreaterThan(20);
  });

  it('is instance-safe — AppError is detectable', () => {
    const err = AppError.unauthorized('test');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });
});
