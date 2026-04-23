require('dotenv').config();

async function checkCurrentSeason() {
  console.log('Checking current/upcoming season for Al-Qadisiyah FC...\n');

  const teamId = process.env.QADSIAH_TEAM_EXTERNAL_ID;
  
  try {
    // Try 2025 season (current/upcoming)
    console.log('1. Checking 2025 season...');
    const res2025 = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&season=2025`, {
      headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY }
    });
    const json2025 = await res2025.json();
    
    if (json2025.errors && json2025.errors.plan) {
      console.log('❌ 2025 season: Not available on free plan');
    } else {
      console.log(`✓ 2025 season: ${json2025.results} matches found`);
      if (json2025.response.length > 0) {
        const sample = json2025.response[0];
        console.log(`   Sample: ${sample.teams.home.name} vs ${sample.teams.away.name}`);
        console.log(`   Date: ${sample.fixture.date}`);
        console.log(`   Status: ${sample.fixture.status.short}`);
      }
    }

    // Try 2024 season (what we have data for)
    console.log('\n2. Checking 2024 season...');
    const res2024 = await fetch(`https://v3.football.api-sports.io/fixtures?team=${teamId}&season=2024`, {
      headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY }
    });
    const json2024 = await res2024.json();
    
    console.log(`✓ 2024 season: ${json2024.results} matches found`);
    
    // Check date range of 2024 season
    if (json2024.response.length > 0) {
      const dates = json2024.response.map(m => new Date(m.fixture.date));
      const earliest = new Date(Math.min(...dates));
      const latest = new Date(Math.max(...dates));
      
      console.log(`   Season period: ${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()}`);
      
      // Count upcoming vs finished
      const now = new Date();
      const upcoming = json2024.response.filter(m => 
        m.fixture.status.short === 'NS' && new Date(m.fixture.date) > now
      );
      const finished = json2024.response.filter(m => 
        ['FT', 'AET', 'PEN'].includes(m.fixture.status.short)
      );
      
      console.log(`   Upcoming: ${upcoming.length}`);
      console.log(`   Finished: ${finished.length}`);
      
      if (upcoming.length > 0) {
        console.log('\n📅 Upcoming matches from 2024 season:');
        upcoming.slice(0, 3).forEach((match, i) => {
          console.log(`   ${i+1}. ${match.teams.home.name} vs ${match.teams.away.name}`);
          console.log(`      ${new Date(match.fixture.date).toLocaleDateString()}`);
        });
      }
    }

    // Check what current date and season we're in
    console.log('\n3. Current context:');
    const now = new Date();
    console.log(`   Current date: ${now.toLocaleDateString()}`);
    console.log(`   Current year: ${now.getFullYear()}`);
    
    // Saudi Pro League typically runs Aug-May
    const currentMonth = now.getMonth() + 1; // 1-12
    if (currentMonth >= 8 && currentMonth <= 12) {
      console.log('   Likely in: 2025-2026 season (Aug-Dec)');
    } else if (currentMonth >= 1 && currentMonth <= 5) {
      console.log('   Likely in: 2024-2025 season (Jan-May)');
    } else {
      console.log('   Likely in: Off-season (Jun-Jul)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

if (!process.env.API_FOOTBALL_KEY) {
  console.error('❌ API_FOOTBALL_KEY not found');
  process.exit(1);
}

checkCurrentSeason();
