require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const sportApi = require('./src/services/sportApiService');
const { redis } = require('./src/config/redis');

const prisma = new PrismaClient();

async function importTeamPlayers() {
  console.log('Importing Al-Qadisiyah FC players into database...\n');

  const teamId = process.env.QADSIAH_TEAM_EXTERNAL_ID;
  if (!teamId) {
    console.error('❌ QADSIAH_TEAM_EXTERNAL_ID not found');
    await prisma.$disconnect();
    process.exit(1);
  }

  try {
    // 1. Fetch team players from API
    console.log('1. Fetching team players from API...');
    const players = await sportApi.fetchTeamPlayers(teamId, 2024);
    
    if (!players || players.length === 0) {
      console.error('❌ No players found for team');
      await prisma.$disconnect();
      process.exit(1);
    }

    console.log(`✓ Found ${players.length} players from API`);
    
    // Display player summary
    const positionCounts = {};
    players.forEach(player => {
      positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
    });
    
    console.log('   Position breakdown:');
    Object.entries(positionCounts).forEach(([pos, count]) => {
      console.log(`   ${pos}: ${count} players`);
    });

    // 2. Check existing players in database
    console.log('\n2. Checking existing players in database...');
    const existingPlayers = await prisma.player.findMany({
      where: { externalId: { not: null } }
    });
    
    const existingExternalIds = new Set(existingPlayers.map(p => p.externalId));
    const newPlayers = players.filter(p => !existingExternalIds.has(p.externalId));
    const existingExternalIdsInTeam = players.filter(p => existingExternalIds.has(p.externalId));
    
    console.log(`✓ Existing players in database: ${existingPlayers.length}`);
    console.log(`✓ New players to import: ${newPlayers.length}`);
    console.log(`✓ Players already in database: ${existingExternalIdsInTeam.length}`);

    // 3. Import new players
    console.log('\n3. Importing new players...');
    let importedCount = 0;
    let updatedCount = 0;
    
    for (const player of players) {
      try {
        // Prepare player data
        const playerData = {
          externalId: player.externalId,
          nameEn: player.nameEn,
          nameAr: player.nameAr,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          photoUrl: player.photoUrl,
          fantasyValue: calculateFantasyValue(player.position, player.age),
          isActive: !player.injured
        };

        // Check if player exists (by external ID or name)
        const existingPlayer = await prisma.player.findFirst({
          where: {
            OR: [
              { externalId: player.externalId },
              { nameEn: player.nameEn }
            ]
          }
        });

        if (existingPlayer) {
          // Update existing player
          await prisma.player.update({
            where: { id: existingPlayer.id },
            data: {
              ...playerData,
              externalId: existingPlayer.externalId || playerData.externalId
            }
          });
          updatedCount++;
          console.log(`   ✓ Updated: ${player.nameEn} (${player.position})`);
        } else {
          // Create new player
          await prisma.player.create({
            data: playerData
          });
          importedCount++;
          console.log(`   ✓ Imported: ${player.nameEn} (${player.position}, #${player.jerseyNumber || 'N/A'})`);
        }
      } catch (error) {
        console.error(`   ❌ Failed to import ${player.nameEn}: ${error.message}`);
      }
    }

    // 4. Fetch and store player statistics (optional, for additional data)
    console.log('\n4. Fetching player statistics...');
    let statsImported = 0;
    
    // Get league ID for Al-Qadisiyah (Saudi Pro League is typically ID 61)
    const leagueId = 61;
    
    for (const player of players.slice(0, 5)) { // Limit to first 5 to avoid rate limits
      try {
        const stats = await sportApi.fetchPlayerStatistics(player.externalId, 2024, leagueId);
        if (stats) {
          // Store stats in AuditLog for reference
          await prisma.auditLog.create({
            data: {
              action: 'PLAYER_STATS_STORED',
              entity: 'Player',
              entityId: player.externalId,
              meta: stats
            }
          });
          statsImported++;
          console.log(`   ✓ Stats: ${player.nameEn} (${stats.appearances} apps, ${stats.goals} goals)`);
        }
      } catch (err) {
        // Skip stats errors
      }
    }

    // 5. Create summary
    console.log('\n📊 Import Summary:');
    console.log(`   Team: Al-Qadisiyah FC (ID: ${teamId})`);
    console.log(`   Total players fetched: ${players.length}`);
    console.log(`   New players imported: ${importedCount}`);
    console.log(`   Existing players updated: ${updatedCount}`);
    console.log(`   Player statistics fetched: ${statsImported}`);
    
    console.log('\n📋 Position Breakdown:');
    Object.entries(positionCounts).forEach(([pos, count]) => {
      console.log(`   ${pos}: ${count} players`);
    });

    // 6. Display sample of imported players
    console.log('\n🏆 Sample of imported players:');
    const samplePlayers = await prisma.player.findMany({
      where: { externalId: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    samplePlayers.forEach((player, i) => {
      console.log(`   ${i+1}. ${player.nameEn} (${player.position}) - ${player.jerseyNumber ? '#' + player.jerseyNumber : 'N/A'}`);
    });

    console.log('\n✅ Player import completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   - Players are now available in the database');
    console.log('   - Can be used for fantasy squad selection');
    console.log('   - Statistics stored for reference');

  } catch (error) {
    console.error('❌ Error during import:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function calculateFantasyValue(position, age) {
  // Basic fantasy value calculation based on position and age
  const baseValues = {
    'GK': 10,
    'DEF': 8,
    'MID': 10,
    'FWD': 12
  };
  
  const baseValue = baseValues[position] || 10;
  
  // Adjust for age (prime age 25-30 gets highest value)
  if (age >= 25 && age <= 30) {
    return baseValue + 2;
  } else if (age < 23 || age > 33) {
    return Math.max(5, baseValue - 2);
  }
  
  return baseValue;
}

if (!process.env.API_FOOTBALL_KEY) {
  console.error('❌ API_FOOTBALL_KEY not found');
  process.exit(1);
}

importTeamPlayers();
