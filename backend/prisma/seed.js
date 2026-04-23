/* eslint-disable no-console */
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const env = require('../src/config/env');

const prisma = new PrismaClient();

const BADGES = [
  { key: 'first_prediction', nameEn: 'Prophet', nameAr: 'العرّاف', descriptionEn: 'Submit your first prediction' },
  { key: 'perfect_prediction', nameEn: 'Oracle', nameAr: 'كاهن', descriptionEn: 'Get all 4 prediction fields correct', pointsReward: 100 },
  { key: 'hot_streak_3', nameEn: 'On Fire', nameAr: 'ملتهب', descriptionEn: '3-match prediction streak' },
  { key: 'hot_streak_7', nameEn: 'Unstoppable', nameAr: 'لا يُوقف', descriptionEn: '7-match prediction streak' },
  { key: 'squad_goal_x5', nameEn: 'Goal Factory', nameAr: 'مصنع الأهداف', descriptionEn: 'Squad players score 5+ goals' },
  { key: 'top_10_weekly', nameEn: 'Elite Fan', nameAr: 'مشجع النخبة', descriptionEn: 'Finish in the weekly top 10' },
  { key: 'login_streak_7', nameEn: 'Loyal Supporter', nameAr: 'مشجع وفي', descriptionEn: '7 consecutive daily logins', pointsReward: 75 },
  { key: 'clean_sheet_bonus', nameEn: 'Iron Wall', nameAr: 'الحائط الحديدي', descriptionEn: 'Predict a clean sheet correctly' },
];

const PLAYERS = [
  { nameEn: 'Nawaf Al-Aqidi', nameAr: 'نواف العقيدي', position: 'GK', jerseyNumber: 1, fantasyValue: 8 },
  { nameEn: 'Koen Casteels',  nameAr: 'كوين كاستيلز', position: 'GK', jerseyNumber: 31, fantasyValue: 9 },
  { nameEn: 'Nasser Al-Dawsari', nameAr: 'ناصر الدوسري', position: 'DEF', jerseyNumber: 3, fantasyValue: 8 },
  { nameEn: 'Ahmed Bamsaud',  nameAr: 'أحمد بامسعود', position: 'DEF', jerseyNumber: 4, fantasyValue: 7 },
  { nameEn: 'Cameron Puertas', nameAr: 'كاميرون بويرتاس', position: 'MID', jerseyNumber: 10, fantasyValue: 12 },
  { nameEn: 'Pierre-Emile Højbjerg', nameAr: 'هويبيرغ', position: 'MID', jerseyNumber: 23, fantasyValue: 13 },
  { nameEn: 'Nacer Chadli',   nameAr: 'ناصر الشاذلي', position: 'MID', jerseyNumber: 8, fantasyValue: 10 },
  { nameEn: 'Ezequiel Fernández', nameAr: 'إزيكيل فرنانديز', position: 'MID', jerseyNumber: 6, fantasyValue: 11 },
  { nameEn: 'Mateus Gonçalves', nameAr: 'ماتيوس جونسالفيس', position: 'FWD', jerseyNumber: 11, fantasyValue: 11 },
  { nameEn: 'Julián Quiñones', nameAr: 'كينيونيس', position: 'FWD', jerseyNumber: 9, fantasyValue: 14 },
  { nameEn: 'Gaston Álvarez', nameAr: 'ألفاريز', position: 'DEF', jerseyNumber: 2, fantasyValue: 9 },
];

async function main() {
  // Admin user
  const adminHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: env.ADMIN_EMAIL },
    update: { role: 'admin' },
    create: {
      email: env.ADMIN_EMAIL,
      username: env.ADMIN_USERNAME,
      passwordHash: adminHash,
      displayName: 'Qadsiah Admin',
      role: 'admin',
      language: 'en',
    },
  });
  console.log(`✓ admin ensured (${env.ADMIN_EMAIL})`);

  // Badges
  for (const b of BADGES) {
    await prisma.badge.upsert({ where: { key: b.key }, update: b, create: b });
  }
  console.log(`✓ ${BADGES.length} badges seeded`);

  // Players (idempotent by nameEn — no externalId yet)
  for (const p of PLAYERS) {
    const existing = await prisma.player.findFirst({ where: { nameEn: p.nameEn } });
    if (existing) {
      await prisma.player.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.player.create({ data: p });
    }
  }
  console.log(`✓ ${PLAYERS.length} players seeded`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
