const pool = require("./mysql");

async function main() {
  try {
    const [rows] = await pool.query("SELECT 1 AS test");
    console.log("MySQL connected OK:", rows);
    process.exit(0);
  } catch (err) {
    console.error("MySQL connection error:", err);
    process.exit(1);
  }
}

main();
