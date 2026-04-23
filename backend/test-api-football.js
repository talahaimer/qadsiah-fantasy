require('dotenv').config();
const sportApi = require('./src/services/sportApiService');

async function testApiFootball() {
  console.log('Testing API-Football integration...\n');

  try {
    // Test 1: Fetch live matches
    console.log('1. Testing fetchLiveMatches...');
    const liveMatches = await sportApi.fetchLiveMatches();
    console.log(`✓ Found ${liveMatches.length} live matches`);
    if (liveMatches.length > 0) {
      console.log('Sample match:', JSON.stringify(liveMatches[0], null, 2));
    }
    console.log('');

    // Test 2: Fetch match statistics (using first live match if available)
    if (liveMatches.length > 0) {
      console.log('2. Testing fetchMatchStatistics...');
      const stats = await sportApi.fetchMatchStatistics(liveMatches[0].externalId);
      console.log('✓ Statistics fetched:', stats ? 'Success' : 'No data');
      if (stats) {
        console.log('Sample stats:', JSON.stringify(stats, null, 2));
      }
      console.log('');

      // Test 3: Fetch match lineups
      console.log('3. Testing fetchMatchLineups...');
      const lineups = await sportApi.fetchMatchLineups(liveMatches[0].externalId);
      console.log('✓ Lineups fetched:', lineups ? 'Success' : 'No data');
      if (lineups) {
        console.log('Sample lineups:', JSON.stringify(lineups, null, 2));
      }
      console.log('');

      // Test 4: Fetch match events
      console.log('4. Testing fetchMatchEvents...');
      const events = await sportApi.fetchMatchEvents({ externalId: liveMatches[0].externalId });
      console.log(`✓ Found ${events.length} events`);
      if (events.length > 0) {
        console.log('Sample event:', JSON.stringify(events[0], null, 2));
      }
    }

    console.log('\n✅ API-Football integration test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
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

testApiFootball();
