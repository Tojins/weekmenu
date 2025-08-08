import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Check for --env flag in arguments
let envFile = '.env.local';
const envArgIndex = process.argv.indexOf('--env');
if (envArgIndex !== -1 && process.argv[envArgIndex + 1]) {
    envFile = `.env.${process.argv[envArgIndex + 1]}`;
}

dotenv.config({ path: envFile });

class DatabaseUtils {
    constructor() {
        // Use different connection string based on environment
        if (envFile === '.env.test') {
            // Local test database
            this.connectionString = 'postgresql://postgres:postgres@localhost:54322/postgres';
        } else {
            // Production database
            this.connectionString = `postgresql://postgres.${process.env.SUPABASE_PROJECT_REF}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;
        }
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

    insertRecipe(title, cookingInstructions, timeEstimation, url, recipeUrlCandidateId, imageUrl, numberOfServings = null) {
        const escapedTitle = this.escapeString(title);
        const escapedInstructions = this.escapeString(cookingInstructions);
        const escapedUrl = this.escapeString(url);
        const escapedImageUrl = this.escapeString(imageUrl);

        const columns = ['title', 'cooking_instructions', 'time_estimation', 'url', 'recipe_url_candidate_id', 'image_url'];
        const values = [`'${escapedTitle}'`, `'${escapedInstructions}'`, timeEstimation, `'${escapedUrl}'`, `'${recipeUrlCandidateId}'`, `'${escapedImageUrl}'`];

        if (numberOfServings !== null) {
            columns.push('number_of_servings');
            values.push(numberOfServings);
        }

        const sql = `INSERT INTO recipes (${columns.join(', ')}) VALUES (${values.join(', ')}) RETURNING id;`;
        return this.query(sql);
    }

    insertRecipeIngredients(recipeId, ingredients) {
        const values = ingredients.map((ingredient, index) => {
            const { productId, quantity, unit, dutchDescription } = ingredient;
            const escapedUnit = this.escapeString(unit);
            const escapedDutchDescription = dutchDescription ? this.escapeString(dutchDescription) : null;
            const ingredientOrder = index + 1; // Start order from 1
            
            if (dutchDescription) {
                return `('${recipeId}', ${ingredientOrder}, '${productId}', '${quantity}', '${escapedUnit}', '${escapedDutchDescription}')`;
            } else {
                return `('${recipeId}', ${ingredientOrder}, '${productId}', '${quantity}', '${escapedUnit}', NULL)`;
            }
        }).join(', ');

        const sql = `INSERT INTO recipe_ingredients (recipe_id, ingredient_order, product_id, quantity, unit, dutch_description) VALUES ${values};`;
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
            ? `INSERT INTO recipe_search_history (search_query, status, user_id) VALUES ('${escapedText}', 'initial', '${userId}') RETURNING id;`
            : `INSERT INTO recipe_search_history (search_query, status) VALUES ('${escapedText}', 'initial') RETURNING id;`;
        return this.query(sql);
    }

    updateSearchHistory(id, status) {
        const escapedStatus = this.escapeString(status);
        const sql = `UPDATE recipe_search_history SET status = '${escapedStatus}', updated_at = NOW() WHERE id = '${id}';`;
        return this.query(sql);
    }

    findCachedIngredient(ingredientDescription) {
        const escapedDescription = this.escapeString(ingredientDescription);
        const sql = `SELECT product_id FROM ingredient_product_cache WHERE ingredient_description = '${escapedDescription}';`;
        return this.query(sql);
    }

    // Phase 1 methods
    getRecentSearchQueries(limit = 50) {
        const sql = `SELECT search_query FROM recipe_search_history ORDER BY created_at DESC LIMIT ${limit};`;
        return this.query(sql);
    }

    countInitialSearchQueries() {
        const sql = `SELECT COUNT(*) as count FROM recipe_search_history WHERE status = 'INITIAL';`;
        return this.query(sql);
    }

    // Phase 2 methods
    findInitialSearchQuery() {
        const sql = `SELECT id, search_query FROM recipe_search_history WHERE status = 'INITIAL' LIMIT 1;`;
        return this.query(sql);
    }

    // Generic status update methods
    atomicStatusUpdate(table, id, newStatus, currentStatus) {
        const sql = `UPDATE ${table} SET status = '${newStatus}', updated_at = NOW() WHERE id = '${id}' AND status = '${currentStatus}';`;
        return this.query(sql);
    }

    updateStatus(table, id, newStatus) {
        const sql = `UPDATE ${table} SET status = '${newStatus}', updated_at = NOW() WHERE id = '${id}';`;
        return this.query(sql);
    }

    // Phase 2 methods
    lockSearchQuery(searchHistoryId) {
        return this.atomicStatusUpdate('recipe_search_history', searchHistoryId, 'ONGOING', 'INITIAL');
    }

    insertUrlCandidate(searchHistoryId, url) {
        const escapedUrl = this.escapeString(url);
        const sql = `INSERT INTO recipe_url_candidates (recipe_search_history_id, url, status) VALUES ('${searchHistoryId}', '${escapedUrl}', 'INITIAL') RETURNING id;`;
        return this.query(sql);
    }

    completeSearchQuery(searchHistoryId) {
        return this.updateStatus('recipe_search_history', searchHistoryId, 'COMPLETED');
    }

    // Phase 3 methods
    findInitialUrlCandidate() {
        const sql = `SELECT id, url FROM recipe_url_candidates WHERE status = 'INITIAL' LIMIT 1;`;
        return this.query(sql);
    }

    lockUrlCandidate(urlCandidateId) {
        return this.atomicStatusUpdate('recipe_url_candidates', urlCandidateId, 'INVESTIGATING', 'INITIAL');
    }

    checkExistingRecipeUrl(url) {
        const escapedUrl = this.escapeString(url);
        const sql = `SELECT id FROM recipes WHERE url = '${escapedUrl}';`;
        return this.query(sql);
    }

    acceptUrlCandidate(urlCandidateId) {
        return this.updateStatus('recipe_url_candidates', urlCandidateId, 'ACCEPTED');
    }

    rejectUrlCandidate(urlCandidateId) {
        return this.updateStatus('recipe_url_candidates', urlCandidateId, 'REJECTED');
    }

    storeTimeEstimation(urlCandidateId, timeMinutes) {
        const sql = `UPDATE recipe_url_candidates SET time_estimation_minutes = ${timeMinutes} WHERE id = '${urlCandidateId}';`;
        return this.query(sql);
    }

    // Phase 4 methods
    findAcceptedUrlCandidate() {
        const sql = `SELECT id, url, recipe_search_history_id, time_estimation_minutes FROM recipe_url_candidates WHERE status = 'ACCEPTED' LIMIT 1;`;
        return this.query(sql);
    }

    lockAcceptedUrlCandidate(urlCandidateId) {
        return this.atomicStatusUpdate('recipe_url_candidates', urlCandidateId, 'CREATING', 'ACCEPTED');
    }

    markUrlCandidateCreated(urlCandidateId) {
        return this.updateStatus('recipe_url_candidates', urlCandidateId, 'CREATED');
    }

    getProductsByDescriptions(descriptions) {
        const descArray = descriptions.split(',').map(desc => `'${this.escapeString(desc.trim())}'`);
        const sql = `
            SELECT 
                p.id,
                p.name,
                p.image_url,
                p.normalized_price,
                p.english_description,
                p.season_start_month,
                p.season_end_month,
                sc.category_name
            FROM products p
            LEFT JOIN store_categories sc ON p.store_category_id = sc.id
            WHERE p.english_description IN (${descArray.join(', ')})
            ORDER BY p.normalized_price ASC
        `;
        return this.query(sql);
    }

    // Timeout reversion methods
    revertStuckRecords() {
        const sql = `
            WITH stuck_searches AS (
                UPDATE recipe_search_history 
                SET status = 'INITIAL', started_at = NULL 
                WHERE status = 'ONGOING' 
                AND started_at < NOW() - INTERVAL '10 minutes'
                RETURNING 'search_history' as table_name, id
            ),
            stuck_candidates AS (
                UPDATE recipe_url_candidates 
                SET status = CASE 
                    WHEN status = 'INVESTIGATING' THEN 'INITIAL'
                    WHEN status = 'CREATING' THEN 'ACCEPTED'
                END, 
                started_at = NULL 
                WHERE status IN ('INVESTIGATING', 'CREATING') 
                AND started_at < NOW() - INTERVAL '10 minutes'
                RETURNING 'url_candidates' as table_name, id
            )
            SELECT * FROM stuck_searches
            UNION ALL
            SELECT * FROM stuck_candidates;`;
        return this.query(sql);
    }

    viewStuckSearchQueries() {
        const sql = `SELECT * FROM stuck_search_queries;`;
        return this.query(sql);
    }

    viewStuckUrlCandidates() {
        const sql = `SELECT * FROM stuck_url_candidates;`;
        return this.query(sql);
    }
}

const db = new DatabaseUtils();

// Parse command and args, filtering out --env flag
let command, args;
if (process.argv[2] === '--env') {
    // --env flag is present, command is at position 4
    command = process.argv[4];
    args = process.argv.slice(5);
} else {
    // No --env flag, command is at position 2
    command = process.argv[2];
    args = process.argv.slice(3);
}

if (!command) {
    console.error('Usage: node db-utils.js [--env test|local] <command> [args...]');
    console.error('Commands:');
    console.error('  query "SQL"');
    console.error('  insert-recipe "title" "instructions" time_estimation "url" "recipe_url_candidate_id" "image_url" [number_of_servings]');
    console.error('  insert-recipe-ingredients "recipe_id" "product_id:quantity:unit[:dutch_description],..."');
    console.error('  check-similar-recipes "product_id1,product_id2,..."');
    console.error('  insert-search-history "search_text" ["user_id"]');
    console.error('  update-search-history "id" "search_text"');
    console.error('  find-cached-ingredient "ingredient_description"');
    console.error('  get-recent-search-queries [limit]');
    console.error('  count-initial-search-queries');
    console.error('  find-initial-search-query');
    console.error('  lock-search-query "search_history_id"');
    console.error('  insert-url-candidate "search_history_id" "url"');
    console.error('  complete-search-query "search_history_id"');
    console.error('  find-initial-url-candidate');
    console.error('  lock-url-candidate "url_candidate_id"');
    console.error('  check-existing-recipe-url "url"');
    console.error('  accept-url-candidate "url_candidate_id"');
    console.error('  reject-url-candidate "url_candidate_id"');
    console.error('  store-time-estimation "url_candidate_id" time_minutes');
    console.error('  find-accepted-url-candidate');
    console.error('  lock-accepted-url-candidate "url_candidate_id"');
    console.error('  mark-url-candidate-created "url_candidate_id"');
    console.error('  get-products-by-descriptions "description1,description2,..."');
    console.error('  revert-stuck-records');
    console.error('  view-stuck-search-queries');
    console.error('  view-stuck-url-candidates');
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
            if (args.length < 6) throw new Error('Missing required arguments - need title, instructions, time_estimation, url, recipe_url_candidate_id, and image_url');
            const numberOfServings = args[6] ? parseInt(args[6]) : null;
            result = db.insertRecipe(args[0], args[1], args[2], args[3], args[4], args[5], numberOfServings);
            break;
            
        case 'insert-recipe-ingredients':
            if (args.length < 2) throw new Error('Missing required arguments');
            const ingredients = args[1].split(',').map(ingredient => {
                const parts = ingredient.split(':');
                const [productId, quantity, unit] = parts;
                const dutchDescription = parts[3] || null; // Optional 4th part
                return { productId, quantity, unit, dutchDescription };
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

        case 'get-recent-search-queries':
            const limit = args[0] ? parseInt(args[0]) : 50;
            result = db.getRecentSearchQueries(limit);
            break;

        case 'count-initial-search-queries':
            result = db.countInitialSearchQueries();
            break;

        case 'find-initial-search-query':
            result = db.findInitialSearchQuery();
            break;

        case 'lock-search-query':
            if (!args[0]) throw new Error('Search history ID required');
            result = db.lockSearchQuery(args[0]);
            break;

        case 'insert-url-candidate':
            if (args.length < 2) throw new Error('Missing required arguments');
            result = db.insertUrlCandidate(args[0], args[1]);
            break;

        case 'complete-search-query':
            if (!args[0]) throw new Error('Search history ID required');
            result = db.completeSearchQuery(args[0]);
            break;

        case 'find-initial-url-candidate':
            result = db.findInitialUrlCandidate();
            break;

        case 'lock-url-candidate':
            if (!args[0]) throw new Error('URL candidate ID required');
            result = db.lockUrlCandidate(args[0]);
            break;

        case 'check-existing-recipe-url':
            if (!args[0]) throw new Error('URL required');
            result = db.checkExistingRecipeUrl(args[0]);
            break;

        case 'accept-url-candidate':
            if (!args[0]) throw new Error('URL candidate ID required');
            result = db.acceptUrlCandidate(args[0]);
            break;

        case 'reject-url-candidate':
            if (!args[0]) throw new Error('URL candidate ID required');
            result = db.rejectUrlCandidate(args[0]);
            break;

        case 'store-time-estimation':
            if (args.length < 2) throw new Error('URL candidate ID and time minutes required');
            result = db.storeTimeEstimation(args[0], parseInt(args[1]));
            break;

        case 'find-accepted-url-candidate':
            result = db.findAcceptedUrlCandidate();
            break;

        case 'lock-accepted-url-candidate':
            if (!args[0]) throw new Error('URL candidate ID required');
            result = db.lockAcceptedUrlCandidate(args[0]);
            break;

        case 'mark-url-candidate-created':
            if (!args[0]) throw new Error('URL candidate ID required');
            result = db.markUrlCandidateCreated(args[0]);
            break;

        case 'get-products-by-descriptions':
            if (!args[0]) throw new Error('Descriptions required (comma-separated)');
            result = db.getProductsByDescriptions(args[0]);
            break;

        case 'revert-stuck-records':
            result = db.revertStuckRecords();
            break;

        case 'view-stuck-search-queries':
            result = db.viewStuckSearchQueries();
            break;

        case 'view-stuck-url-candidates':
            result = db.viewStuckUrlCandidates();
            break;
            
        default:
            throw new Error(`Unknown command: ${command}`);
    }
    
    console.log(result);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}