const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    const sqlPath = path.join(__dirname, '../prisma/schema.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error('Schema file not found at:', sqlPath);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Check if the database is already initialized
    const checkRes = await pool.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admins')");
    if (checkRes.rows[0].exists) {
      console.log('Database already initialized. Skipping schema execution.');
      return;
    }

    console.log('Executing schema initialization...');
    await pool.query(sql);
    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
    // We don't exit with error here because if the tables already exist, 
    // the diff script might fail on CREATE TABLE. 
    // In a production scenario, we should handle this more gracefully, 
    // but for now, we'll let it proceed to app start.
  } finally {
    await pool.end();
  }
}

initDb();
