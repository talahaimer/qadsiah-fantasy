const env = require('../config/env');
const logger = require('../config/logger');
const prisma = require('../config/database');

async function sendExpoPush(userId, title, body, data = {}) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.expoPushToken) return;
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(env.EXPO_ACCESS_TOKEN ? { Authorization: `Bearer ${env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify({ to: user.expoPushToken, title, body, data, sound: 'default' }),
    });
    if (!res.ok) logger.warn({ status: res.status }, 'expo push failed');
  } catch (err) {
    logger.error({ err }, 'expo push error');
  }
}

async function sendEmail(_to, _subject, _html) {
  // Mailjet integration placeholder. Wire when credentials are available.
  if (!env.MAILJET_API_KEY) {
    logger.debug('Email skipped — Mailjet not configured');
    return;
  }
}

module.exports = { sendExpoPush, sendEmail };
