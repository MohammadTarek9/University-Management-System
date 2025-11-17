const pool = require('./db/mysql');
const fs = require('fs');

async function createTable() {
  try {
    const sql = fs.readFileSync('./sql_scripts/create-course-materials-table.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const stmt of statements) {
      if (stmt.trim() && !stmt.trim().startsWith('--')) {
        await pool.query(stmt);
        console.log('Executed statement');
      }
    }
    
    console.log('✓ Table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTable();
