require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const sportApi = require('./src/services/sportApiService');

const prisma = new PrismaClient();

async function fetchAndStoreTeamInfo() {
  console.log('Fetching and storing team information for Al-Qadisiyah FC...\n');

  const teamId = process.env.QADSIAH_TEAM_EXTERNAL_ID;
  if (!teamId) {
    console.error('❌ QADSIAH_TEAM_EXTERNAL_ID not found');
    await prisma.$disconnect();
    process.exit(1);
  }

  try {
    // 1. Fetch team information from API
    console.log('1. Fetching team information from API...');
    const teamInfo = await sportApi.fetchTeamInformation(teamId);
    
    if (!teamInfo) {
      console.error('❌ Failed to fetch team information');
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log('✓ Team information fetched:');
    console.log(`   Name: ${teamInfo.name}`);
    console.log(`   Country: ${teamInfo.country}`);
    console.log(`   Founded: ${teamInfo.founded}`);
    console.log(`   External ID: ${teamInfo.externalId}`);
    console.log('');

    // 2. Check if team exists in matches database
    console.log('2. Checking existing team references in database...');
    const existingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeam: { contains: 'Qadsiah', mode: 'insensitive' } },
          { awayTeam: { contains: 'Qadsiah', mode: 'insensitive' } },
          { homeTeam: { contains: 'Qadisiyah', mode: 'insensitive' } },
          { awayTeam: { contains: 'Qadisiyah', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`✓ Found ${existingMatches.length} existing matches with team references`);

    if (existingMatches.length > 0) {
      console.log('Sample matches:');
      existingMatches.slice(0, 3).forEach((match, i) => {
        console.log(`   ${i+1}. ${match.homeTeam} vs ${match.awayTeam} (${new Date(match.matchDate).toLocaleDateString()})`);
      });
    }
    console.log('');

    // 3. Create/update team information in a metadata table
    console.log('3. Storing team information...');
    
    // Since there's no dedicated Team model, we'll store team info in a JSON format
    // We can use the AuditLog table as a temporary storage or create a custom approach
    
    // For now, let's store it as a JSON file and also update match references
    const teamData = {
      externalId: teamInfo.externalId,
      name: teamInfo.name,
      country: teamInfo.country,
      founded: teamInfo.founded,
      logo: teamInfo.logo,
      national: teamInfo.national,
      venue: null, // We'll fetch this separately
      lastUpdated: new Date().toISOString(),
      apiProvider: process.env.SPORT_API_PROVIDER || 'api_football'
    };

    // Store team info in a JSON file for reference
    const fs = require('fs').promises;
    await fs.writeFile('./team-alqadisiyah-info.json', JSON.stringify(teamData, null, 2));
    console.log('✓ Team information saved to team-alqadisiyah-info.json');

    // 4. Fetch venue information if available
    console.log('\n4. Fetching venue information...');
    try {
      // Try to get venue info from a direct API call
      const venueRes = await fetch(
        `https://v3.football.api-sports.io/teams?id=${teamId}`,
        { headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY } }
      );
      const venueJson = await venueRes.json();
      
      if (venueJson.response && venueJson.response[0] && venueJson.response[0].venue) {
        const venue = venueJson.response[0].venue;
        teamData.venue = {
          id: venue.id,
          name: venue.name,
          address: venue.address,
          city: venue.city,
          capacity: venue.capacity,
          surface: venue.surface,
          image: venue.image
        };
        console.log('✓ Venue information fetched:');
        console.log(`   Name: ${venue.name}`);
        console.log(`   City: ${venue.city}`);
        console.log(`   Capacity: ${venue.capacity}`);
        
        // Update the JSON file with venue info
        await fs.writeFile('./team-alqadisiyah-info.json', JSON.stringify(teamData, null, 2));
        console.log('✓ Updated team info with venue data');
      }
    } catch (venueErr) {
      console.log('⚠️ Could not fetch venue information');
    }

    // 5. Update match references if needed (normalize team names)
    console.log('\n5. Checking if match team names need updating...');
    const currentTeamName = teamInfo.name;
    const variations = ['Al-Qadsiah', 'Al Qadsiah', 'Qadsiah', 'Al-Qadisiyah', 'Al Qadisiyah', 'Qadisiyah'];
    
    let updatedCount = 0;
    for (const variation of variations) {
      const matchesToUpdate = await prisma.match.findMany({
        where: {
          OR: [
            { homeTeam: variation },
            { awayTeam: variation }
          ]
        }
      });

      for (const match of matchesToUpdate) {
        await prisma.match.update({
          where: { id: match.id },
          data: {
            homeTeam: match.homeTeam === variation ? currentTeamName : match.homeTeam,
            awayTeam: match.awayTeam === variation ? currentTeamName : match.awayTeam
          }
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`✓ Updated ${updatedCount} match references to use correct team name: "${currentTeamName}"`);
    } else {
      console.log('✓ Team names are already consistent');
    }

    // 6. Create a summary
    console.log('\n📊 Summary:');
    console.log(`   Team: ${teamInfo.name}`);
    console.log(`   External ID: ${teamInfo.externalId}`);
    console.log(`   Country: ${teamInfo.country}`);
    console.log(`   Founded: ${teamInfo.founded}`);
    if (teamData.venue) {
      console.log(`   Venue: ${teamData.venue.name} (${teamData.venue.city})`);
    }
    console.log(`   Matches in database: ${existingMatches.length}`);
    console.log(`   Match name updates: ${updatedCount}`);
    console.log(`   Data saved to: team-alqadisiyah-info.json`);

    console.log('\n✅ Team information successfully fetched and stored!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (!process.env.API_FOOTBALL_KEY) {
  console.error('❌ API_FOOTBALL_KEY not found');
  process.exit(1);
}

fetchAndStoreTeamInfo();
