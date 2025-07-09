import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Usage: node db_insert_recipe_ingredients.js "recipe_id" "product_id1:quantity1:unit1,product_id2:quantity2:unit2,..."
const [recipeId, ingredientsString] = process.argv.slice(2);

if (!recipeId || !ingredientsString) {
    console.error('Usage: node db_insert_recipe_ingredients.js "recipe_id" "product_id1:quantity1:unit1,product_id2:quantity2:unit2,..."');
    process.exit(1);
}

const connectionString = `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;

// Parse ingredients and build VALUES clause
const ingredients = ingredientsString.split(',');
const values = ingredients.map(ingredient => {
    const [productId, quantity, unit] = ingredient.split(':');
    const escapedUnit = unit.replace(/'/g, "''");
    return `('${recipeId}', '${productId}', '${quantity}', '${escapedUnit}')`;
}).join(', ');

const sql = `INSERT INTO recipe_ingredients (recipe_id, product_id, quantity, unit) VALUES ${values};`;

try {
    const result = execSync(`psql "${connectionString}" -c "${sql}"`, { encoding: 'utf8' });
    console.log(result);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}