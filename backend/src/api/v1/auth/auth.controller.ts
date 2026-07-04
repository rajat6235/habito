import { Request, Response, NextFunction } from 'express';
import { container } from '../../../container';
import { sendSuccess, sendCreated } from '../../../utils/response';
import { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.validation';
import { env } from '../../../config/env';
import ms from 'ms';

const REFRESH_COOKIE = 'habito_refresh';

function setRefreshCookie(res: Response, token: string, rememberMe: boolean): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: ms(rememberMe ? env.JWT_REFRESH_REMEMBER_ME_EXPIRES_IN : env.JWT_REFRESH_EXPIRES_IN),
    path: '/api/v1/auth',
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as RegisterInput;
    const result = await container.authService.register({
      email:     body.email,
      password:  body.password,
      firstName: body.firstName,
      username:  body.username,
      ...(body.lastName !== undefined ? { lastName: body.lastName } : {}),
    });

    await container.emailService.sendVerification(
      body.email,
      result.verificationToken,
      body.firstName,
    );

    sendCreated(res, {
      message: 'Account created. Please check your email to verify your account.',
      userId: result.userId,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as LoginInput;
    const result = await container.authService.login({
      email:      body.email,
      password:   body.password,
      rememberMe: body.rememberMe,
      ...(req.get('user-agent') ? { userAgent: req.get('user-agent')! } : {}),
      ...(req.ip                ? { ipAddress: req.ip                } : {}),
    });

    setRefreshCookie(res, result.refreshToken, body.rememberMe);

    sendSuccess(res, {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: result.user,
    });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (!token) {
      res.status(401).json({ success: false, error: { code: 'TOKEN_MISSING', message: 'No refresh token' } });
      return;
    }

    const result = await container.authService.refreshTokens(token);

    setRefreshCookie(res, result.refreshToken, false);

    sendSuccess(res, {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    });
  } catch (err) {
    clearRefreshCookie(res);
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user?.sessionId) {
      await container.authService.logout(req.user.sessionId);
    }
    clearRefreshCookie(res);
    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

export async function logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await container.authService.logoutAll(req.user.id, req.user.sessionId);
    }
    clearRefreshCookie(res);
    sendSuccess(res, { message: 'Logged out from all devices' });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params as { token: string };
    await container.authService.verifyEmail(token);
    sendSuccess(res, { message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body as ForgotPasswordInput;
    const result = await container.authService.requestPasswordReset(email);
    // Fire-and-forget email — never reveal whether the address exists
    if (result) {
      void container.emailService.sendPasswordReset(email, result.token, result.firstName);
    }
    // Always return success to prevent email enumeration
    sendSuccess(res, { message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body as ResetPasswordInput;
    await container.authService.resetPassword(token, password);
    clearRefreshCookie(res);
    sendSuccess(res, { message: 'Password updated. Please log in with your new password.' });
  } catch (err) {
    next(err);
  }
}
