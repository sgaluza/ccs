/**
 * Dashboard Authentication Routes
 * Handles login, logout, session check, and setup status.
 */

import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import { getDashboardAuthConfig } from '../../config/unified-config-loader';
import { loginRateLimiter } from '../middleware/auth-middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user with username/password.
 * Rate limited: 5 attempts per 15 minutes.
 */
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password required' });
    return;
  }

  const authConfig = getDashboardAuthConfig();

  // Check if auth is configured
  if (!authConfig.enabled || !authConfig.username || !authConfig.password_hash) {
    res.status(400).json({ error: 'Authentication not configured' });
    return;
  }

  // Verify credentials
  const usernameMatch = username === authConfig.username;
  const passwordMatch = await bcrypt.compare(password, authConfig.password_hash);

  if (!usernameMatch || !passwordMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Set session
  req.session.authenticated = true;
  req.session.username = username;

  res.json({ success: true, username });
});

/**
 * POST /api/auth/logout
 * Clear session and log out user.
 */
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

/**
 * GET /api/auth/check
 * Check if user is authenticated and if auth is required.
 */
router.get('/check', (req: Request, res: Response) => {
  const authConfig = getDashboardAuthConfig();

  res.json({
    authRequired: authConfig.enabled,
    authenticated: req.session?.authenticated ?? false,
    username: req.session?.username ?? null,
  });
});

/**
 * GET /api/auth/setup
 * Check if authentication is properly configured.
 */
router.get('/setup', (_req: Request, res: Response) => {
  const authConfig = getDashboardAuthConfig();

  res.json({
    enabled: authConfig.enabled,
    configured: !!(authConfig.username && authConfig.password_hash),
    sessionTimeoutHours: authConfig.session_timeout_hours ?? 24,
  });
});

export default router;
