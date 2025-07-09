import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Usage: node db_update_search_history.js "search_history_id"
const searchHistoryId = process.argv[2];

if (!searchHistoryId) {
    console.error('Usage: node db_update_search_history.js "search_history_id"');
    process.exit(1);
}

const connectionString = `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;

const sql = `UPDATE recipe_search_history SET status = 'completed' WHERE id = '${searchHistoryId}';`;

try {
    const result = execSync(`psql "${connectionString}" -c "${sql}"`, { encoding: 'utf8' });
    console.log(result);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}