import { Router } from 'express';
import { validate } from '../../../middleware/validate.middleware';
import { authenticate } from '../../../middleware/auth.middleware';
import { requireRole } from '../../../middleware/rbac.middleware';
import { auditLog } from '../../../middleware/audit.middleware';
import {
  listUsersQuerySchema,
  updateUserAdminSchema,
  impersonateSchema,
  updateFeatureFlagSchema,
  updateGlobalSettingSchema,
  listAuditLogsQuerySchema,
} from './admin.validation';
import {
  listUsers,
  getUser,
  getUserOverview,
  getUserHabits,
  getUserJournals,
  getUserGoals,
  getUserTasks,
  updateUser,
  deleteUser,
  impersonateUser,
  endImpersonation,
  listAuditLogs,
  getFeatureFlags,
  updateFeatureFlag,
  getGlobalSettings,
  updateGlobalSetting,
  getSystemStats,
} from './admin.controller';

export const adminRouter = Router();

const adminAuth = [authenticate, requireRole('admin', 'super_admin')];

// ── Users ──────────────────────────────────────────────────────────────────────

adminRouter.get(
  '/users',
  ...adminAuth,
  validate(listUsersQuerySchema, 'query'),
  listUsers,
);

adminRouter.get('/users/:id/overview',  ...adminAuth, getUserOverview);
adminRouter.get('/users/:id/habits',    ...adminAuth, getUserHabits);
adminRouter.get('/users/:id/journals',  ...adminAuth, getUserJournals);
adminRouter.get('/users/:id/goals',     ...adminAuth, getUserGoals);
adminRouter.get('/users/:id/tasks',     ...adminAuth, getUserTasks);
adminRouter.get('/users/:id',           ...adminAuth, getUser);

adminRouter.patch(
  '/users/:id',
  ...adminAuth,
  validate(updateUserAdminSchema),
  auditLog({
    action:      'admin.user_updated',
    entityType:  'user',
    getEntityId: req => req.params['id'],
  }),
  updateUser,
);

adminRouter.delete(
  '/users/:id',
  ...adminAuth,
  auditLog({
    action:      'admin.user_deleted',
    entityType:  'user',
    getEntityId: req => req.params['id'],
  }),
  deleteUser,
);

adminRouter.post(
  '/users/:id/impersonate',
  ...adminAuth,
  validate(impersonateSchema),
  auditLog({
    action:      'admin.impersonation_started',
    entityType:  'user',
    getEntityId: req => req.params['id'],
  }),
  impersonateUser,
);

// ── Impersonation ──────────────────────────────────────────────────────────────

adminRouter.post(
  '/impersonation/:id/end',
  ...adminAuth,
  auditLog({
    action:      'admin.impersonation_ended',
    entityType:  'impersonation_session',
    getEntityId: req => req.params['id'],
  }),
  endImpersonation,
);

// ── Audit Logs ─────────────────────────────────────────────────────────────────

adminRouter.get(
  '/audit-logs',
  ...adminAuth,
  validate(listAuditLogsQuerySchema, 'query'),
  listAuditLogs,
);

// ── Feature Flags ──────────────────────────────────────────────────────────────

adminRouter.get(
  '/feature-flags',
  ...adminAuth,
  getFeatureFlags,
);

adminRouter.patch(
  '/feature-flags/:key',
  ...adminAuth,
  validate(updateFeatureFlagSchema),
  auditLog({
    action:      'admin.feature_flag_updated',
    entityType:  'feature_flag',
    getEntityId: req => req.params['key'],
  }),
  updateFeatureFlag,
);

// ── Global Settings ────────────────────────────────────────────────────────────

adminRouter.get(
  '/settings',
  ...adminAuth,
  getGlobalSettings,
);

adminRouter.patch(
  '/settings/:key',
  ...adminAuth,
  validate(updateGlobalSettingSchema),
  auditLog({
    action:      'admin.setting_updated',
    entityType:  'global_setting',
    getEntityId: req => req.params['key'],
  }),
  updateGlobalSetting,
);

// ── Stats ──────────────────────────────────────────────────────────────────────

adminRouter.get(
  '/stats',
  ...adminAuth,
  getSystemStats,
);
