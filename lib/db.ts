import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("error no .env");
}

const sql = postgres(connectionString);

export default sql;
