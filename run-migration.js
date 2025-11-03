const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking if data column exists...');

    // Check if column exists first
    const columns = await prisma.$queryRawUnsafe(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'Asset' 
        AND COLUMN_NAME = 'data'
    `);

    if (columns.length > 0) {
      console.log('✅ Column already exists, no action needed.');
      return;
    }

    console.log('Adding data column to Asset table...');

    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE Asset ADD COLUMN data LONGBLOB NULL
    `);

    console.log('✅ Migration applied successfully!');
    console.log('The data column has been added to the Asset table.');
  } catch (error) {
    if (error.message && error.message.includes('Duplicate column')) {
      console.log('✅ Column already exists, no action needed.');
    } else {
      console.error('❌ Error applying migration:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

