const prisma = require('../config/database');
const logger = require('../config/logger');
const sportApi = require('../services/sportApiService');
const { getIO } = require('../config/socket');

module.exports = async function liveScoringJob(job) {
  logger.info('Starting live scoring job');
  
  try {
    const liveMatches = await sportApi.fetchLiveMatches();
    if (!liveMatches.length) {
      return { matches: 0, updated: 0 };
    }

    let updated = 0;
    
    for (const matchData of liveMatches) {
      try {
        // Check if match exists in our database
        const existingMatch = await prisma.match.findFirst({
          where: { externalId: matchData.externalId }
        });

        if (!existingMatch) {
          // Create new match if it doesn't exist
          await prisma.match.create({
            data: {
              externalId: matchData.externalId,
              homeTeam: matchData.homeTeam,
              awayTeam: matchData.awayTeam,
              homeScore: matchData.homeScore || 0,
              awayScore: matchData.awayScore || 0,
              status: matchData.status,
              minute: matchData.minute,
              league: matchData.league,
              leagueId: matchData.leagueId,
              date: matchData.date,
              venue: matchData.venue,
            }
          });
          logger.info({ externalId: matchData.externalId }, 'Created new live match');
        } else {
          // Update existing match if data has changed
          const hasChanges = 
            existingMatch.homeScore !== matchData.homeScore ||
            existingMatch.awayScore !== matchData.awayScore ||
            existingMatch.status !== matchData.status ||
            existingMatch.minute !== matchData.minute;

          if (hasChanges) {
            const updatedMatch = await prisma.match.update({
              where: { id: existingMatch.id },
              data: {
                homeScore: matchData.homeScore || 0,
                awayScore: matchData.awayScore || 0,
                status: matchData.status,
                minute: matchData.minute,
              }
            });
            
            // Emit real-time update to clients
            try {
              getIO().to(`match:${existingMatch.id}`).emit('match_update', updatedMatch);
              getIO().to('live_matches').emit('live_match_update', updatedMatch);
            } catch (socketErr) {
              logger.warn({ err: socketErr }, 'Failed to emit socket update');
            }
            
            updated++;
            logger.info({ 
              matchId: existingMatch.id, 
              externalId: matchData.externalId,
              status: matchData.status,
              score: `${matchData.homeScore}-${matchData.awayScore}`
            }, 'Updated live match');
          }
        }

        // If match is live, trigger event sync
        if (matchData.status === 'live' && existingMatch) {
          const { queues } = require('../config/queue');
          await queues.matchSync.add(
            { matchId: existingMatch.id },
            { 
              delay: 1000, // 1 second delay to avoid rate limits
              removeOnComplete: 10,
              removeOnFail: 5
            }
          ).catch(() => {});
        }

      } catch (err) {
        logger.error({ 
          err, 
          externalId: matchData.externalId 
        }, 'Failed to process live match');
      }
    }

    logger.info({ 
      total: liveMatches.length, 
      updated 
    }, 'Live scoring job completed');

    return { 
      matches: liveMatches.length, 
      updated 
    };

  } catch (err) {
    logger.error({ err }, 'Live scoring job failed');
    throw err;
  }
};
