#!/usr/bin/env node

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

if (process.argv.length !== 3) {
    console.error('Usage: node db_get_products_by_descriptions.js "description1,description2,description3"');
    process.exit(1);
}

const descriptions = process.argv[2].split(',');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function getProductsByDescriptions() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
                id,
                name,
                image_url,
                normalized_price,
                english_description,
                season_start_month,
                season_end_month,
                store_categories(category_name)
            `)
            .in('english_description', descriptions);

        if (error) {
            console.error('Error:', error);
            process.exit(1);
        }

        // Filter for seasonal products
        const currentMonth = new Date().getMonth() + 1;
        const filteredData = data.filter(product => {
            if (product.season_start_month === null) return true;
            return currentMonth >= product.season_start_month && currentMonth <= product.season_end_month;
        });

        console.log(JSON.stringify(filteredData, null, 2));
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

getProductsByDescriptions();