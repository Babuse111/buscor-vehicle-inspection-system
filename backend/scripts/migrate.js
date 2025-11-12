const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Starting database migration...');
    
    // Read and execute schema
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, '../database/schema.sql'), 
      'utf8'
    );
    
    await pool.query(schemaSQL);
    console.log('✅ Schema migration completed successfully');

    // Read and execute seed data
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '../database/seed.sql'), 
      'utf8'
    );
    
    await pool.query(seedSQL);
    console.log('✅ Seed data inserted successfully');

    console.log('\n🎉 Database setup completed!');
    console.log('\nDefault admin credentials:');
    console.log('  Email: admin@inspectionapp.com');
    console.log('  Password: admin123');
    
    console.log('\nDefault driver credentials:');
    console.log('  Email: john.smith@company.com');
    console.log('  Password: driver123');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();