const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPlayers() {
  console.log('Verifying player import...\n');
  
  // Get all players with external IDs
  const players = await prisma.player.findMany({
    where: { externalId: { not: null } },
    orderBy: [{ position: 'asc' }, { nameEn: 'asc' }]
  });
  
  console.log(`✓ Total players in database: ${players.length}\n`);
  
  // Group by position
  const byPosition = {};
  players.forEach(player => {
    if (!byPosition[player.position]) byPosition[player.position] = [];
    byPosition[player.position].push(player);
  });
  
  // Display by position
  Object.entries(byPosition).forEach(([pos, posPlayers]) => {
    console.log(`${pos} (${posPlayers.length}):`);
    posPlayers.forEach(player => {
      const jersey = player.jerseyNumber ? `#${player.jerseyNumber}` : 'N/A';
      console.log(`  • ${player.nameEn} (${jersey}) - Age: ${player.age || 'N/A'}`);
    });
    console.log('');
  });
  
  // Show some sample data
  console.log('📊 Sample player details:');
  const sample = players[0];
  console.log(`   Name: ${sample.nameEn}`);
  console.log(`   Position: ${sample.position}`);
  console.log(`   External ID: ${sample.externalId}`);
  console.log(`   Jersey: ${sample.jerseyNumber || 'N/A'}`);
  console.log(`   Age: ${sample.age || 'N/A'}`);
  console.log(`   Nationality: ${sample.nationality || 'N/A'}`);
  console.log(`   Fantasy Value: ${sample.fantasyValue}`);
  console.log(`   Active: ${sample.isActive}`);
  
  await prisma.$disconnect();
}

verifyPlayers().catch(console.error);
