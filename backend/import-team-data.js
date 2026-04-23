require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const sportApi = require('./src/services/sportApiService');

const prisma = new PrismaClient();

async function importTeamData() {
  console.log('Importing Al-Qadisiyah FC team data into database...\n');

  const teamId = process.env.QADSIAH_TEAM_EXTERNAL_ID;
  if (!teamId) {
    console.error('❌ QADSIAH_TEAM_EXTERNAL_ID not found');
    await prisma.$disconnect();
    process.exit(1);
  }

  try {
    // 1. Fetch comprehensive team information
    console.log('1. Fetching comprehensive team information...');
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

    // 2. Fetch venue information
    console.log('\n2. Fetching venue information...');
    let venueInfo = null;
    try {
      const venueRes = await fetch(
        `https://v3.football.api-sports.io/teams?id=${teamId}`,
        { headers: { 'x-apisports-key': process.env.API_FOOTBALL_KEY } }
      );
      const venueJson = await venueRes.json();
      
      if (venueJson.response && venueJson.response[0] && venueJson.response[0].venue) {
        const venue = venueJson.response[0].venue;
        venueInfo = {
          id: venue.id,
          name: venue.name,
          address: venue.address,
          city: venue.city,
          capacity: venue.capacity,
          surface: venue.surface,
          image: venue.image
        };
        console.log(`✓ Venue: ${venue.name} (${venue.city}, ${venue.capacity} capacity)`);
      }
    } catch (venueErr) {
      console.log('⚠️ Could not fetch venue information');
    }

    // 3. Store team information in database using AuditLog as temporary storage
    console.log('\n3. Storing team information in database...');
    
    const teamData = {
      externalId: teamInfo.externalId,
      name: teamInfo.name,
      country: teamInfo.country,
      founded: teamInfo.founded,
      logo: teamInfo.logo,
      national: teamInfo.national,
      venue: venueInfo,
      lastUpdated: new Date().toISOString(),
      apiProvider: process.env.SPORT_API_PROVIDER || 'api_football'
    };

    // Store in AuditLog as a team record
    await prisma.auditLog.create({
      data: {
        action: 'TEAM_INFO_STORED',
        entity: 'Team',
        entityId: teamInfo.externalId,
        meta: teamData
      }
    });
    console.log('✓ Team information stored in database (AuditLog)');

    // 4. Update existing matches with correct team names
    console.log('\n4. Updating match team names...');
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
            homeTeam: match.homeTeam === variation ? teamInfo.name : match.homeTeam,
            awayTeam: match.awayTeam === variation ? teamInfo.name : match.awayTeam
          }
        });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`✓ Updated ${updatedCount} match references to use correct team name`);
    } else {
      console.log('✓ Team names are already consistent');
    }

    // 5. Fetch and store recent match history
    console.log('\n5. Fetching recent match history...');
    const matches = await sportApi.fetchTeamMatches(teamId, 2024, 50);
    
    if (matches.length > 0) {
      console.log(`✓ Found ${matches.length} matches in API`);
      
      let importedMatches = 0;
      for (const match of matches) {
        try {
          // Check if match already exists
          const existingMatch = await prisma.match.findFirst({
            where: { externalId: match.externalId }
          });

          if (!existingMatch) {
            await prisma.match.create({
              data: {
                externalId: match.externalId,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                matchDate: match.date,
                venue: match.venue,
                status: match.status === 'finished' ? 'completed' : 
                        match.status === 'live' ? 'live' : 'scheduled',
                homeScore: match.homeScore || 0,
                awayScore: match.awayScore || 0,
                competition: match.league,
                season: match.season?.toString() || '2024'
              }
            });
            importedMatches++;
          }
        } catch (err) {
          // Skip duplicates
          if (!err.message.includes('Unique constraint')) {
            console.warn(`⚠️ Could not import match ${match.externalId}: ${err.message}`);
          }
        }
      }
      
      console.log(`✓ Imported ${importedMatches} new matches`);
    } else {
      console.log('⚠️ No matches found to import');
    }

    // 6. Create team summary
    console.log('\n📊 Import Summary:');
    console.log(`   Team: ${teamInfo.name}`);
    console.log(`   External ID: ${teamInfo.externalId}`);
    console.log(`   Country: ${teamInfo.country}`);
    console.log(`   Founded: ${teamInfo.founded}`);
    if (venueInfo) {
      console.log(`   Venue: ${venueInfo.name} (${venueInfo.city})`);
    }
    console.log(`   Matches processed: ${matches.length}`);
    console.log(`   Match name updates: ${updatedCount}`);
    console.log(`   Data stored in: Database (AuditLog table)`);
    console.log(`   JSON backup: team-alqadisiyah-info.json`);

    // 7. Save JSON backup
    const fs = require('fs').promises;
    await fs.writeFile('./team-alqadisiyah-info.json', JSON.stringify(teamData, null, 2));

    console.log('\n✅ Team data import completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Team info is stored in database (AuditLog)');
    console.log('   - Match references are normalized');
    console.log('   - Historical matches are imported');
    console.log('   - JSON backup is available');

  } catch (error) {
    console.error('❌ Error during import:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (!process.env.API_FOOTBALL_KEY) {
  console.error('❌ API_FOOTBALL_KEY not found');
  process.exit(1);
}

importTeamData();
