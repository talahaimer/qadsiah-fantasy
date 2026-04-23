require('dotenv').config();
const sportApi = require('./src/services/sportApiService');
const fs = require('fs').promises;
const path = require('path');

async function fetchQadisiyahData() {
  console.log('Fetching Al Qadisiyah FC data for 2023 (latest available season with complete data)...\n');

  const teamId = process.env.QADSIAH_TEAM_EXTERNAL_ID;
  if (!teamId) {
    console.error('❌ QADSIAH_TEAM_EXTERNAL_ID not found in environment variables');
    console.log('Please set the team ID in your .env file:');
    console.log('QADSIAH_TEAM_EXTERNAL_ID=2933');
    process.exit(1);
  }

  // Use 2023 as it should have more complete data on free plan
  const season = 2023;

  try {
    // 1. Fetch team information
    console.log('1. Fetching team information...');
    const teamInfo = await sportApi.fetchTeamInformation(teamId);
    if (teamInfo) {
      console.log('✓ Team information fetched:');
      console.log(`   Name: ${teamInfo.name}`);
      console.log(`   Country: ${teamInfo.country}`);
      console.log(`   Founded: ${teamInfo.founded}`);
      console.log(`   External ID: ${teamInfo.externalId}`);
    } else {
      console.log('❌ Team information not found');
    }
    console.log('');

    // 2. Fetch leagues for 2024
    console.log(`2. Fetching leagues for ${season}...`);
    const leagues = await sportApi.fetchTeamLeagues(teamId, season);
    console.log(`✓ Found ${leagues.length} leagues:`);
    leagues.forEach((league, index) => {
      console.log(`   ${index + 1}. ${league.name} (${league.country})`);
      console.log(`      Season: ${league.season}`);
      console.log(`      Type: ${league.type}`);
      if (league.start && league.end) {
        console.log(`      Period: ${league.start} to ${league.end}`);
      }
      console.log('');
    });

    // 3. Fetch matches for 2024
    console.log(`3. Fetching matches for ${season}...`);
    const matches = await sportApi.fetchTeamMatches(teamId, season, 100);
    console.log(`✓ Found ${matches.length} matches in ${season}:`);
    
    // Group matches by status
    const matchesByStatus = {
      finished: [],
      live: [],
      scheduled: [],
      other: []
    };

    matches.forEach(match => {
      switch (match.status) {
        case 'finished':
          matchesByStatus.finished.push(match);
          break;
        case 'live':
          matchesByStatus.live.push(match);
          break;
        case 'scheduled':
          matchesByStatus.scheduled.push(match);
          break;
        default:
          matchesByStatus.other.push(match);
      }
    });

    // Display finished matches
    if (matchesByStatus.finished.length > 0) {
      console.log('\n   📋 Finished Matches:');
      matchesByStatus.finished.forEach((match, index) => {
        const result = `${match.homeScore}-${match.awayScore}`;
        const winner = match.homeScore > match.awayScore ? match.homeTeam : 
                      match.awayScore > match.homeScore ? match.awayTeam : 'Draw';
        console.log(`   ${index + 1}. ${match.homeTeam} ${result} ${match.awayTeam} (${match.league})`);
        console.log(`      Date: ${match.date.toLocaleDateString()}, Winner: ${winner}`);
      });
    }

    // Display live matches
    if (matchesByStatus.live.length > 0) {
      console.log('\n   🔴 Live Matches:');
      matchesByStatus.live.forEach((match, index) => {
        const result = `${match.homeScore}-${match.awayScore}`;
        console.log(`   ${index + 1}. ${match.homeTeam} ${result} ${match.awayTeam} (${match.league})`);
        console.log(`      Minute: ${match.minute}, Venue: ${match.venue || 'N/A'}`);
      });
    }

    // Display scheduled matches
    if (matchesByStatus.scheduled.length > 0) {
      console.log('\n   📅 Upcoming Matches:');
      matchesByStatus.scheduled.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.homeTeam} vs ${match.awayTeam} (${match.league})`);
        console.log(`      Date: ${match.date.toLocaleDateString()}, Venue: ${match.venue || 'N/A'}`);
      });
    }

    // Display other status matches
    if (matchesByStatus.other.length > 0) {
      console.log('\n   ❓ Other Status Matches:');
      matchesByStatus.other.forEach((match, index) => {
        const result = match.homeScore !== undefined && match.awayScore !== undefined ? 
                     `${match.homeScore}-${match.awayScore}` : 'N/A';
        console.log(`   ${index + 1}. ${match.homeTeam} ${result} ${match.awayTeam} (${match.league})`);
        console.log(`      Status: ${match.status}, Date: ${match.date.toLocaleDateString()}`);
      });
    }

    // 4. Save data to JSON files
    console.log('\n4. Saving data to files...');
    const outputDir = `./qadisiyah-data-${season}`;
    await fs.mkdir(outputDir, { recursive: true });

    // Save team info
    if (teamInfo) {
      await fs.writeFile(
        path.join(outputDir, 'team-info.json'),
        JSON.stringify(teamInfo, null, 2)
      );
      console.log('✓ Team info saved to team-info.json');
    }

    // Save leagues
    await fs.writeFile(
      path.join(outputDir, 'leagues.json'),
      JSON.stringify(leagues, null, 2)
    );
    console.log('✓ Leagues saved to leagues.json');

    // Save matches
    await fs.writeFile(
      path.join(outputDir, 'matches.json'),
      JSON.stringify(matches, null, 2)
    );
    console.log('✓ Matches saved to matches.json');

    // Save summary
    const summary = {
      team: teamInfo,
      totalMatches: matches.length,
      matchesByStatus: {
        finished: matchesByStatus.finished.length,
        live: matchesByStatus.live.length,
        scheduled: matchesByStatus.scheduled.length,
        other: matchesByStatus.other.length
      },
      leagues: leagues.length,
      generatedAt: new Date().toISOString()
    };

    await fs.writeFile(
      path.join(outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    console.log('✓ Summary saved to summary.json');

    console.log(`\n✅ All data saved to '${outputDir}' directory!`);
    console.log('\n📊 Summary:');
    console.log(`   Total matches: ${matches.length}`);
    console.log(`   Finished: ${matchesByStatus.finished.length}`);
    console.log(`   Live: ${matchesByStatus.live.length}`);
    console.log(`   Scheduled: ${matchesByStatus.scheduled.length}`);
    console.log(`   Leagues: ${leagues.length}`);

  } catch (error) {
    console.error('❌ Failed to fetch data:', error.message);
    console.error('Full error:', error);
  }
}

// Check if API key is configured
if (!process.env.API_FOOTBALL_KEY) {
  console.error('❌ API_FOOTBALL_KEY not found in environment variables');
  console.log('Please set your API-Football key in your .env file:');
  console.log('API_FOOTBALL_KEY=your_api_key_here');
  process.exit(1);
}

fetchQadisiyahData();
