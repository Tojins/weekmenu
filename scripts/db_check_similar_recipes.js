import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Usage: node db_check_similar_recipes.js "product_id1,product_id2,product_id3"
const productIds = process.argv[2];
if (!productIds) {
    console.error('Usage: node db_check_similar_recipes.js "product_id1,product_id2,product_id3"');
    process.exit(1);
}

const connectionString = `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;

// Convert comma-separated list to SQL array format
const sqlArray = productIds.split(',').map(id => `'${id.trim()}'`).join(', ');

const sql = `SELECT MAX(match_count) as max_matching_ingredients FROM (SELECT recipe_id, COUNT(*) as match_count FROM recipe_ingredients WHERE product_id IN (${sqlArray}) GROUP BY recipe_id) matches;`;

try {
    const result = execSync(`psql "${connectionString}" -c "${sql}"`, { encoding: 'utf8' });
    console.log(result);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}