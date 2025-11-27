require("dotenv").config();

const sql = require("./db").default;

async function testConnection() {
  try {
    const result = await sql`SELECT NOW()`;
    console.log("Database connected!");
    console.log("Server time:", result[0].now);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

testConnection();
