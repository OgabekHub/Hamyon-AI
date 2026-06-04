import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export function verifyTelegramWebappData(initData) {
  if (!BOT_TOKEN) {
    return { verified: false, reason: 'Bot token not configured' };
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { verified: false, reason: 'Hash missing' };

    // Extract all parameters except 'hash' and sort them
    const keys = Array.from(params.keys()).filter(k => k !== 'hash').sort();
    const dataCheckString = keys.map(k => `${k}=${params.get(k)}`).join('\n');

    // Create secret key using HMACS-SHA256 with "WebappData" and bot token
    const secretKey = crypto.createHmac('sha256', 'WebappData').update(BOT_TOKEN).digest();
    
    // Validate signature
    const validationHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (validationHash === hash) {
      const userRaw = params.get('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      return { verified: true, user };
    }

    return { verified: false, reason: 'Hash mismatch' };
  } catch (error) {
    return { verified: false, reason: error.message };
  }
}

export function authMiddleware(req, res, next) {
  // Rivojlanish (Development) rejimida osongina test qilish uchun
  const devTelegramId = req.headers['x-telegram-id'] || req.query.telegram_id;
  if (process.env.NODE_ENV === 'development' || !BOT_TOKEN || devTelegramId) {
    if (devTelegramId) {
      req.user = {
        id: parseInt(devTelegramId),
        first_name: req.headers['x-telegram-name'] || 'Jasur Dev',
        username: 'jasur_dev'
      };
      return next();
    }
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Agar header yo'q bo'lsa va local dev bo'lsa standart mock foydalanuvchi
    if (process.env.NODE_ENV === 'development' || !BOT_TOKEN) {
      req.user = {
        id: 123456789,
        first_name: 'Jasur (Mock)',
        username: 'jasur_mock'
      };
      return next();
    }
    return res.status(401).json({ error: 'Avtorizatsiya ma\'lumotlari yuborilmadi' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'tma') {
    return res.status(401).json({ error: 'Noto\'g\'ri avtorizatsiya formati. "tma <initData>" kutilmoqda' });
  }

  const initData = parts[1];
  const verification = verifyTelegramWebappData(initData);
  
  if (verification.verified && verification.user) {
    req.user = verification.user; // contains id, first_name, username etc.
    return next();
  }

  // Agar tekshiruv muvaffaqiyatsiz bo'lsa, lekin local dev bo'lsa
  if (process.env.NODE_ENV === 'development' || !BOT_TOKEN) {
    req.user = {
      id: 123456789,
      first_name: 'Jasur (Mock)',
      username: 'jasur_mock'
    };
    return next();
  }

  return res.status(401).json({ error: `Avtorizatsiya muvaffaqiyatsiz tugadi: ${verification.reason}` });
}
