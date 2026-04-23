// This script adds a Team model to the Prisma schema
// Run this with: node add-team-model.js

const fs = require('fs').promises;
const path = require('path');

async function addTeamModel() {
  console.log('Adding Team model to Prisma schema...\n');

  const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
  
  try {
    // Read current schema
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Check if Team model already exists
    if (schema.includes('model Team')) {
      console.log('✓ Team model already exists in schema');
      return;
    }

    // Define the Team model
    const teamModel = `
model Team {
  id          String   @id @default(uuid())
  externalId  String?  @unique @map("external_id")
  name        String
  nameAr      String?  @map("name_ar")
  country     String?
  founded     Int?
  logoUrl     String?  @map("logo_url")
  website     String?
  national    Boolean  @default(false)
  venueName   String?  @map("venue_name")
  venueCity   String?  @map("venue_city")
  venueCapacity Int?   @map("venue_capacity")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  homeMatches Match[] @relation("HomeTeam")
  awayMatches Match[] @relation("AwayTeam")

  @@map("teams")
}

`;

    // Find the position to insert the Team model (after Player model, before Squad)
    const playerModelEnd = schema.indexOf('@@map("players")\n}');
    if (playerModelEnd === -1) {
      console.error('❌ Could not find Player model in schema');
      return;
    }

    // Insert the Team model
    const newSchema = schema.slice(0, playerModelEnd + 20) + 
                     teamModel + 
                     schema.slice(playerModelEnd + 20);

    // Write updated schema
    await fs.writeFile(schemaPath, newSchema);
    console.log('✓ Team model added to schema');

    // Now update the Match model to use Team relations
    console.log('\nUpdating Match model to use Team relations...');
    
    // Find and replace the Match model
    const matchModelStart = schema.indexOf('model Match');
    const matchModelEnd = schema.indexOf('@@map("matches")', matchModelStart);
    
    if (matchModelStart === -1 || matchModelEnd === -1) {
      console.error('❌ Could not find Match model in schema');
      return;
    }

    // Updated Match model with Team relations
    const updatedMatchModel = `model Match {
  id                  String      @id @default(uuid())
  externalId          String?     @unique @map("external_id")
  homeTeamId          String?     @map("home_team_id")
  awayTeamId          String?     @map("away_team_id")
  homeTeam            String      @map("home_team") // Keep for backward compatibility
  awayTeam            String      @map("away_team") // Keep for backward compatibility
  matchDate           DateTime    @map("match_date")
  venue               String?
  status              MatchStatus @default(scheduled)
  homeScore           Int         @default(0) @map("home_score")
  awayScore           Int         @default(0) @map("away_score")
  competition         String?
  season              String?
  isPredictionLocked  Boolean     @default(false) @map("is_prediction_locked")
  createdAt           DateTime    @default(now()) @map("created_at")
  updatedAt           DateTime    @updatedAt @map("updated_at")

  // Relations
  homeTeamRel         Team?       @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeamRel         Team?       @relation("AwayTeam", fields: [awayTeamId], references: [id])
  events              MatchEvent[]
  predictions         Prediction[]

  @@index([matchDate])
  @@index([status])
  @@map("matches")
}`;

    // Replace the Match model
    const beforeMatch = schema.slice(0, matchModelStart);
    const afterMatch = schema.slice(matchModelEnd + 17); // +17 to skip @@map("matches")
    
    const finalSchema = beforeMatch + updatedMatchModel + afterMatch;

    // Write final schema
    await fs.writeFile(schemaPath, finalSchema);
    console.log('✓ Match model updated with Team relations');

    console.log('\n📝 Summary of changes:');
    console.log('   ✓ Added Team model with venue information');
    console.log('   ✓ Updated Match model with Team relations');
    console.log('   ✓ Kept backward compatibility with string fields');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Run: npm run prisma:migrate');
    console.log('   2. Run: npm run prisma:generate');
    console.log('   3. Run the team data import script');

  } catch (error) {
    console.error('❌ Error updating schema:', error.message);
  }
}

addTeamModel();
