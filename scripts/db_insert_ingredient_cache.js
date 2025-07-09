#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

if (process.argv.length !== 4) {
    console.error('Usage: node db_insert_ingredient_cache.js "ingredient_description" "product_id"');
    process.exit(1);
}

const ingredientDescription = process.argv[2];
const productId = process.argv[3];

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function insertIngredientCache() {
    try {
        const { data, error } = await supabase
            .from('ingredient_product_cache')
            .insert({
                ingredient_description: ingredientDescription,
                product_id: productId
            });

        if (error) {
            console.error('Error:', error);
            process.exit(1);
        }

        console.log('Cache entry inserted successfully');
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

insertIngredientCache();