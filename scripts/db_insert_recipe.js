import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Usage: node db_insert_recipe.js "title" "cooking_instructions" time_estimation "url" "search_history_id" "image_url"
const [title, cookingInstructions, timeEstimation, url, searchHistoryId, imageUrl] = process.argv.slice(2);

if (!title || !cookingInstructions || !timeEstimation || !url || !searchHistoryId) {
    console.error('Usage: node db_insert_recipe.js "title" "cooking_instructions" time_estimation "url" "search_history_id" "image_url"');
    process.exit(1);
}

const connectionString = `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;

// Escape single quotes in strings
const escapedTitle = title.replace(/'/g, "''");
const escapedInstructions = cookingInstructions.replace(/'/g, "''");
const escapedUrl = url.replace(/'/g, "''");
const escapedImageUrl = imageUrl ? imageUrl.replace(/'/g, "''") : null;

const sql = imageUrl 
    ? `INSERT INTO recipes (title, cooking_instructions, time_estimation, url, search_history_id, image_url) VALUES ('${escapedTitle}', '${escapedInstructions}', ${timeEstimation}, '${escapedUrl}', '${searchHistoryId}', '${escapedImageUrl}') RETURNING id;`
    : `INSERT INTO recipes (title, cooking_instructions, time_estimation, url, search_history_id) VALUES ('${escapedTitle}', '${escapedInstructions}', ${timeEstimation}, '${escapedUrl}', '${searchHistoryId}') RETURNING id;`;

try {
    const result = execSync(`psql "${connectionString}" -c "${sql}"`, { encoding: 'utf8' });
    console.log(result);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}