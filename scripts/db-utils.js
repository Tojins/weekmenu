import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

class DatabaseUtils {
    constructor() {
        this.connectionString = `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;
    }

    query(sql) {
        try {
            const result = execSync(`psql "${this.connectionString}" -c "${sql}"`, { encoding: 'utf8' });
            return result;
        } catch (error) {
            console.error('Database query error:', error.message);
            throw error;
        }
    }

    escapeString(str) {
        return str.replace(/'/g, "''");
    }

    insertRecipe(title, cookingInstructions, timeEstimation, url, searchHistoryId, imageUrl = null) {
        const escapedTitle = this.escapeString(title);
        const escapedInstructions = this.escapeString(cookingInstructions);
        const escapedUrl = this.escapeString(url);
        const escapedImageUrl = imageUrl ? this.escapeString(imageUrl) : null;

        const sql = imageUrl 
            ? `INSERT INTO recipes (title, cooking_instructions, time_estimation, url, search_history_id, image_url) VALUES ('${escapedTitle}', '${escapedInstructions}', ${timeEstimation}, '${escapedUrl}', '${searchHistoryId}', '${escapedImageUrl}') RETURNING id;`
            : `INSERT INTO recipes (title, cooking_instructions, time_estimation, url, search_history_id) VALUES ('${escapedTitle}', '${escapedInstructions}', ${timeEstimation}, '${escapedUrl}', '${searchHistoryId}') RETURNING id;`;

        return this.query(sql);
    }

    insertRecipeIngredients(recipeId, ingredients) {
        const values = ingredients.map(ingredient => {
            const { productId, quantity, unit } = ingredient;
            const escapedUnit = this.escapeString(unit);
            return `('${recipeId}', '${productId}', '${quantity}', '${escapedUnit}')`;
        }).join(', ');

        const sql = `INSERT INTO recipe_ingredients (recipe_id, product_id, quantity, unit) VALUES ${values};`;
        return this.query(sql);
    }

    checkSimilarRecipes(productIds) {
        const sqlArray = productIds.map(id => `'${id.trim()}'`).join(', ');
        const sql = `SELECT MAX(match_count) as max_matching_ingredients FROM (SELECT recipe_id, COUNT(*) as match_count FROM recipe_ingredients WHERE product_id IN (${sqlArray}) GROUP BY recipe_id) matches;`;
        return this.query(sql);
    }

    insertSearchHistory(searchText, userId = null) {
        const escapedText = this.escapeString(searchText);
        const sql = userId 
            ? `INSERT INTO search_history (search_text, user_id) VALUES ('${escapedText}', '${userId}') RETURNING id;`
            : `INSERT INTO search_history (search_text) VALUES ('${escapedText}') RETURNING id;`;
        return this.query(sql);
    }

    updateSearchHistory(id, searchText) {
        const escapedText = this.escapeString(searchText);
        const sql = `UPDATE search_history SET search_text = '${escapedText}', updated_at = NOW() WHERE id = '${id}';`;
        return this.query(sql);
    }

    findCachedIngredient(ingredientDescription) {
        const escapedDescription = this.escapeString(ingredientDescription);
        const sql = `SELECT product_id FROM ingredient_product_cache WHERE ingredient_description = '${escapedDescription}';`;
        return this.query(sql);
    }
}

const db = new DatabaseUtils();

const command = process.argv[2];
const args = process.argv.slice(3);

if (!command) {
    console.error('Usage: node db-utils.js <command> [args...]');
    console.error('Commands:');
    console.error('  query "SQL"');
    console.error('  insert-recipe "title" "instructions" time_estimation "url" "search_history_id" ["image_url"]');
    console.error('  insert-recipe-ingredients "recipe_id" "product_id:quantity:unit,..."');
    console.error('  check-similar-recipes "product_id1,product_id2,..."');
    console.error('  insert-search-history "search_text" ["user_id"]');
    console.error('  update-search-history "id" "search_text"');
    console.error('  find-cached-ingredient "ingredient_description"');
    process.exit(1);
}

try {
    let result;
    
    switch (command) {
        case 'query':
            if (!args[0]) throw new Error('SQL query required');
            result = db.query(args[0]);
            break;
            
        case 'insert-recipe':
            if (args.length < 5) throw new Error('Missing required arguments');
            result = db.insertRecipe(args[0], args[1], args[2], args[3], args[4], args[5]);
            break;
            
        case 'insert-recipe-ingredients':
            if (args.length < 2) throw new Error('Missing required arguments');
            const ingredients = args[1].split(',').map(ingredient => {
                const [productId, quantity, unit] = ingredient.split(':');
                return { productId, quantity, unit };
            });
            result = db.insertRecipeIngredients(args[0], ingredients);
            break;
            
        case 'check-similar-recipes':
            if (!args[0]) throw new Error('Product IDs required');
            result = db.checkSimilarRecipes(args[0].split(','));
            break;
            
        case 'insert-search-history':
            if (!args[0]) throw new Error('Search text required');
            result = db.insertSearchHistory(args[0], args[1]);
            break;
            
        case 'update-search-history':
            if (args.length < 2) throw new Error('Missing required arguments');
            result = db.updateSearchHistory(args[0], args[1]);
            break;
            
        case 'find-cached-ingredient':
            if (!args[0]) throw new Error('Ingredient description required');
            result = db.findCachedIngredient(args[0]);
            break;
            
        default:
            throw new Error(`Unknown command: ${command}`);
    }
    
    console.log(result);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}