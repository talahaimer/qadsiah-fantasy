require('dotenv').config();

async function debugApiResponse() {
  console.log('Debugging API-Football response for team 2933...\n');

  const teamId = process.env.QADSIAH_TEAM_EXTERNAL_ID || '2933';
  
  try {
    // Test direct API call for team info
    console.log('1. Testing team info API call...');
    const res = await fetch(
      `https://v3.football.api-sports.io/teams?id=${teamId}`,
      { headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY } }
    );
    
    console.log(`Status: ${res.status}`);
    const json = await res.json();
    console.log('Raw response:', JSON.stringify(json, null, 2));
    
    // Test matches API call
    console.log('\n2. Testing matches API call...');
    const matchesRes = await fetch(
      `https://v3.football.api-sports.io/fixtures?team=${teamId}&season=2023&last=10`,
      { headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY } }
    );
    
    console.log(`Matches Status: ${matchesRes.status}`);
    const matchesJson = await matchesRes.json();
    console.log('Matches response:', JSON.stringify(matchesJson, null, 2));
    
    // Test leagues API call
    console.log('\n3. Testing leagues API call...');
    const leaguesRes = await fetch(
      `https://v3.football.api-sports.io/leagues?team=${teamId}&season=2023`,
      { headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY } }
    );
    
    console.log(`Leagues Status: ${leaguesRes.status}`);
    const leaguesJson = await leaguesRes.json();
    console.log('Leagues response:', JSON.stringify(leaguesJson, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

if (!process.env.API_FOOTBALL_KEY) {
  console.error('❌ API_FOOTBALL_KEY not found');
  process.exit(1);
}

debugApiResponse();
