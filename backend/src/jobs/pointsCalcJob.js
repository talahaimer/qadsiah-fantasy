const pointsService = require('../services/pointsService');

module.exports = async function pointsCalcJob(job) {
  const { matchId } = job.data;
  return pointsService.resolveMatch(matchId);
};
