import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    env: {
      NODE_ENV:             'test',
      APP_URL:              'http://localhost:4000',
      CLIENT_URL:           'http://localhost:3000',
      DATABASE_URL:         'postgresql://test:test@localhost:5432/test',
      JWT_ACCESS_SECRET:    'test-jwt-access-secret-minimum-32-chars!',
      JWT_REFRESH_SECRET:   'test-jwt-refresh-secret-minimum-32-chars!',
      COOKIE_SECRET:        'test-cookie-secret-minimum-32-chars!!!!',
      SMTP_HOST:            'localhost',
      EMAIL_FROM:           'noreply@habito.test',
    },
  },
});
