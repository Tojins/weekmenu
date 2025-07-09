#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

if (process.argv.length !== 3) {
    console.error('Usage: node db_get_ingredient_cache.js "ingredient_description"');
    process.exit(1);
}

const ingredientDescription = process.argv[2];

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function getIngredientCache() {
    try {
        const { data, error } = await supabase
            .from('ingredient_product_cache')
            .select('product_id')
            .eq('ingredient_description', ingredientDescription);

        if (error) {
            console.error('Error:', error);
            process.exit(1);
        }

        if (data && data.length > 0) {
            console.log(data[0].product_id);
        } else {
            console.log('NULL');
        }
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

getIngredientCache();