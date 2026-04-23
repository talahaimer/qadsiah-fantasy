const Queue = require('bull');
const env = require('./env');

function createQueue(name) {
  return new Queue(name, env.REDIS_URL, {
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    },
  });
}

const queues = {
  matchSync: createQueue('match-sync'),
  pointsCalc: createQueue('points-calc'),
  notifications: createQueue('notifications'),
  weeklyReset: createQueue('weekly-reset'),
  liveScoring: createQueue('live-scoring'),
};

module.exports = { createQueue, queues };
