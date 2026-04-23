require('dotenv').config();
const sportApi = require('./src/services/sportApiService');

async function getUpcomingMatches() {
  console.log('Getting upcoming matches for Al-Qadisiyah FC...\n');

  const teamId = process.env.QADSIAH_TEAM_EXTERNAL_ID;
  if (!teamId) {
    console.error('❌ QADSIAH_TEAM_EXTERNAL_ID not found');
    process.exit(1);
  }

  try {
    // Get all available matches (API returns 2023 data)
    console.log('Fetching all available matches...');
    const matches = await sportApi.fetchTeamMatches(teamId, 2024, 100);
    
    console.log(`✓ Found ${matches.length} total matches in API response\n`);

    // Filter and categorize matches
    const now = new Date();
    const upcoming = [];
    const live = [];
    const recent = [];
    const finished = [];

    matches.forEach(match => {
      const matchDate = new Date(match.date);
      
      if (match.status === 'live') {
        live.push(match);
      } else if (match.status === 'scheduled' && matchDate > now) {
        upcoming.push(match);
      } else if (match.status === 'finished' || match.status === 'FT') {
        finished.push(match);
      } else {
        recent.push(match);
      }
    });

    // Sort upcoming by date
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Display upcoming matches
    if (upcoming.length > 0) {
      console.log(`📅 Upcoming Matches (${upcoming.length}):`);
      upcoming.forEach((match, index) => {
        const matchDate = new Date(match.date);
        const daysUntil = Math.ceil((matchDate - now) / (1000 * 60 * 60 * 24));
        
        console.log(`   ${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
        console.log(`      📆 ${matchDate.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        })} ${matchDate.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`);
        console.log(`      🏆 ${match.league}`);
        console.log(`      📍 ${match.venue || 'TBD'}`);
        console.log(`      ⏰ In ${daysUntil} days`);
        console.log('');
      });
    } else {
      console.log('📅 No upcoming matches found\n');
    }

    // Display live matches
    if (live.length > 0) {
      console.log(`🔴 Live Matches (${live.length}):`);
      live.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`);
        console.log(`      ⏱️ Minute: ${match.minute} | 🏆 ${match.league}`);
        console.log(`      📍 ${match.venue || 'Stadium'}`);
        console.log('');
      });
    }

    // Display recent finished matches (last 5)
    const recentFinished = finished
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recentFinished.length > 0) {
      console.log(`📋 Recent Results (${recentFinished.length}):`);
      recentFinished.forEach((match, index) => {
        const matchDate = new Date(match.date);
        const result = `${match.homeScore}-${match.awayScore}`;
        const winner = match.homeScore > match.awayScore ? match.homeTeam : 
                      match.awayScore > match.homeScore ? match.awayTeam : 'Draw';
        
        console.log(`   ${index + 1}. ${match.homeTeam} ${result} ${match.awayTeam}`);
        console.log(`      📆 ${matchDate.toLocaleDateString()} | 🏆 ${match.league}`);
        console.log(`      🏆 Winner: ${winner}`);
        console.log('');
      });
    }

    // Summary statistics
    console.log('📊 Summary:');
    console.log(`   Total matches in database: ${matches.length}`);
    console.log(`   Upcoming: ${upcoming.length}`);
    console.log(`   Live: ${live.length}`);
    console.log(`   Finished: ${finished.length}`);
    console.log(`   Other status: ${recent.length}`);

    // Next match info
    if (upcoming.length > 0) {
      const nextMatch = upcoming[0];
      const daysUntil = Math.ceil((new Date(nextMatch.date) - now) / (1000 * 60 * 60 * 24));
      console.log(`\n⚡ Next match: ${nextMatch.homeTeam} vs ${nextMatch.awayTeam}`);
      console.log(`   In ${daysUntil} days - ${nextMatch.league}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (!process.env.API_FOOTBALL_KEY) {
  console.error('❌ API_FOOTBALL_KEY not found');
  process.exit(1);
}

getUpcomingMatches();
