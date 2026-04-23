const { queues } = require('../config/queue');
const logger = require('../config/logger');
const syncMatchJob = require('./syncMatchJob');
const pointsCalcJob = require('./pointsCalcJob');
const weeklyResetJob = require('./weeklyResetJob');
const liveScoringJob = require('./liveScoringJob');

function registerJobs() {
  queues.matchSync.process(syncMatchJob);
  queues.pointsCalc.process(pointsCalcJob);
  queues.weeklyReset.process(weeklyResetJob);
  queues.liveScoring.process(liveScoringJob);

  // Weekly reset: every Monday 00:00 UTC
  queues.weeklyReset.add(
    {},
    { repeat: { cron: '0 0 * * 1' }, jobId: 'weekly-reset' }
  ).catch(() => {});

  // Live scoring: every 30 seconds during match hours
  queues.liveScoring.add(
    {},
    { 
      repeat: { cron: '*/30 * * * * *' }, 
      jobId: 'live-scoring',
      removeOnComplete: 20,
      removeOnFail: 10
    }
  ).catch(() => {});

  for (const q of Object.values(queues)) {
    q.on('failed', (job, err) => logger.error({ queue: q.name, jobId: job.id, err }, 'job failed'));
  }

  logger.info('Job queues registered');
}

module.exports = { registerJobs };
