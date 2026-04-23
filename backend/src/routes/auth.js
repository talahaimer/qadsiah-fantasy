const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const { nanoid } = require('nanoid');

const prisma = require('../config/database');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const {
  signAccessToken, signRefreshToken, verifyRefresh, hashToken, parseExpiryToDate,
} = require('../utils/tokens');
const env = require('../config/env');
const badgeService = require('../services/badgeService');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/),
  password: z.string().min(8).max(128),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  displayName: z.string().max(100).optional(),
  language: z.enum(['ar', 'en']).optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(3), // email or username
  password: z.string().min(8),
});

async function issueTokens(user, req) {
  const jti = nanoid();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, jti);
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: parseExpiryToDate(env.JWT_REFRESH_EXPIRES),
      userAgent: req.headers['user-agent'] || null,
      ip: req.ip,
    },
  });
  return { accessToken, refreshToken };
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    language: u.language,
    role: u.role,
    tier: u.tier,
    totalPoints: u.totalPoints,
    weeklyPoints: u.weeklyPoints,
    loginStreak: u.loginStreak,
    isPremium: u.isPremium,
  };
}

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, username, password, firstName, lastName, displayName, language } = req.body;
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) throw ApiError.conflict('Email or username already in use');

    const passwordHash = await bcrypt.hash(password, 12);
    // Generate displayName from firstName and lastName, fallback to username
    const generatedDisplayName = displayName || `${firstName || ''} ${lastName || ''}`.trim() || username;
    
    const user = await prisma.user.create({
      data: {
        email, username, passwordHash,
        firstname: firstName || null,
        lastname: lastName || null,
        displayName: generatedDisplayName,
        language: language || 'ar',
      },
    });
    const tokens = await issueTokens(user, req);
    res.status(201).json({ user: publicUser(user), ...tokens });
  })
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { identifier, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier.toLowerCase() }, { username: identifier }] },
    });
    if (!user) throw ApiError.unauthorized('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw ApiError.unauthorized('Invalid credentials');

    // Login streak update
    const now = new Date();
    const last = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
    let streak = user.loginStreak || 0;
    if (last) {
      const dayDiff = Math.floor((now - last) / 86400000);
      if (dayDiff === 0) { /* same day — no change */ }
      else if (dayDiff === 1) streak += 1;
      else streak = 1;
    } else {
      streak = 1;
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now, loginStreak: streak },
    });
    await badgeService.evaluateLoginStreak(user.id, streak);

    const tokens = await issueTokens(updated, req);
    res.json({ user: publicUser(updated), ...tokens });
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.body?.refreshToken || req.cookies?.refreshToken;
    if (!token) throw ApiError.unauthorized('Missing refresh token');
    let payload;
    try { payload = verifyRefresh(token); } catch { throw ApiError.unauthorized('Invalid refresh token'); }

    const existing = await prisma.refreshToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
      throw ApiError.unauthorized('Refresh token revoked or expired');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw ApiError.unauthorized();

    // rotate: revoke old, issue new pair
    await prisma.refreshToken.update({ where: { id: existing.id }, data: { revokedAt: new Date() } });
    const tokens = await issueTokens(user, req);
    res.json(tokens);
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.body?.refreshToken || req.cookies?.refreshToken;
    if (token) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.status(204).end();
  })
);

// Password reset — minimal scaffolding (email plumbing wired elsewhere)
router.post(
  '/forgot-password',
  asyncHandler(async (_req, res) => {
    // Intentionally returns 204 whether user exists to avoid enumeration
    res.status(204).end();
  })
);

router.post(
  '/reset-password',
  asyncHandler(async (_req, res) => {
    res.status(501).json({ error: { message: 'Not implemented yet' } });
  })
);

module.exports = router;
