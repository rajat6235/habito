import { RoleName } from '@prisma/client';
import { Logger } from 'winston';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      log: Logger;
      user?: AuthUser;
      impersonatingAdminId?: string;
    }
  }
}

export interface AuthUser {
  id: string;
  email: string;
  roles: RoleName[];
  sessionId: string;
  isImpersonated: boolean;
}
