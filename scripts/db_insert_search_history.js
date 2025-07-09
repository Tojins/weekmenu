import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Usage: node db_insert_search_history.js "search query text"
const searchQuery = process.argv[2];
if (!searchQuery) {
    console.error('Usage: node db_insert_search_history.js "search query text"');
    process.exit(1);
}

const connectionString = `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;

const sql = `INSERT INTO recipe_search_history (search_query, status) VALUES ('${searchQuery.replace(/'/g, "''")}', 'initial') RETURNING id;`;

try {
    const result = execSync(`psql "${connectionString}" -c "${sql}"`, { encoding: 'utf8' });
    console.log(result);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}