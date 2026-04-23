require('dotenv').config();
const sportApi = require('./src/services/sportApiService');

async function fetchUpcomingMatches() {
  console.log('Fetching upcoming matches for Al-Qadisiyah FC...\n');

  const teamId = process.env.QADSIAH_TEAM_EXTERNAL_ID;
  if (!teamId) {
    console.error('❌ QADSIAH_TEAM_EXTERNAL_ID not found');
    process.exit(1);
  }

  try {
    // Method 1: Try current season (2024) with all fixtures
    console.log('1. Fetching current season fixtures...');
    const currentSeason = 2024;
    const currentMatches = await sportApi.fetchTeamMatches(teamId, currentSeason, 50);
    
    const upcomingCurrent = currentMatches.filter(match => 
      match.status === 'scheduled' && new Date(match.date) > new Date()
    );
    
    console.log(`✓ Found ${upcomingCurrent.length} upcoming matches in ${currentSeason}:`);
    upcomingCurrent.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
      console.log(`      Date: ${match.date.toLocaleDateString()} ${match.date.toLocaleTimeString()}`);
      console.log(`      League: ${match.league}, Venue: ${match.venue || 'TBD'}`);
      console.log('');
    });

    // Method 2: Try 2023 season for any remaining matches
    console.log('2. Checking 2023 season for remaining matches...');
    const lastSeason = 2023;
    const lastMatches = await sportApi.fetchTeamMatches(teamId, lastSeason, 50);
    
    const upcomingLast = lastMatches.filter(match => 
      match.status === 'scheduled' && new Date(match.date) > new Date()
    );
    
    console.log(`✓ Found ${upcomingLast.length} upcoming matches in ${lastSeason}:`);
    upcomingLast.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
      console.log(`      Date: ${match.date.toLocaleDateString()} ${match.date.toLocaleTimeString()}`);
      console.log(`      League: ${match.league}, Venue: ${match.venue || 'TBD'}`);
      console.log('');
    });

    // Method 3: Try live matches endpoint to see if there are any currently active
    console.log('3. Checking for live matches...');
    const liveMatches = await sportApi.fetchLiveMatches();
    const qadisiyahLive = liveMatches.filter(match => 
      match.homeTeam.includes('Qadisiyah') || match.awayTeam.includes('Qadisiyah') ||
      match.homeTeam.includes('Al-Qadisiyah') || match.awayTeam.includes('Al-Qadisiyah')
    );
    
    if (qadisiyahLive.length > 0) {
      console.log(`🔴 Found ${qadisiyahLive.length} live matches:`);
      qadisiyahLive.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`);
        console.log(`      Minute: ${match.minute}, League: ${match.league}`);
      });
    } else {
      console.log('✓ No live matches currently');
    }

    // Summary
    const totalUpcoming = upcomingCurrent.length + upcomingLast.length + qadisiyahLive.length;
    console.log('\n📊 Summary:');
    console.log(`   Upcoming matches: ${totalUpcoming}`);
    console.log(`   Live matches: ${qadisiyahLive.length}`);
    console.log(`   Current season (${currentSeason}): ${upcomingCurrent.length}`);
    console.log(`   Previous season (${lastSeason}): ${upcomingLast.length}`);

    if (totalUpcoming === 0) {
      console.log('\n💡 No upcoming matches found. This could mean:');
      console.log('   - Season has ended');
      console.log('   - Schedule not yet announced');
      console.log('   - API limitations on free plan');
      console.log('   - Team in off-season period');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (!process.env.API_FOOTBALL_KEY) {
  console.error('❌ API_FOOTBALL_KEY not found');
  process.exit(1);
}

fetchUpcomingMatches();
