// ISO week number helpers, used for weekly leaderboard keys.
function getIsoWeek(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return { year: d.getUTCFullYear(), week: weekNo };
}

function weeklyKey(date = new Date()) {
  const { year, week } = getIsoWeek(date);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

module.exports = { getIsoWeek, weeklyKey };
