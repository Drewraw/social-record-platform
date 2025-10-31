import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

export async function query(text, params) {
	const res = await pool.query(text, params);
	return res;
}
