import fs from 'fs';
import { supabase } from '../src/supabaseClient.js';

async function importCategories() {
  try {
    // Read JSON file
    console.log('Reading Colruyt JSON file...');
    const jsonData = JSON.parse(fs.readFileSync('scripts/colruyt_2024-06-15-08-18-48.json', 'utf8'));
    
    // Extract unique categories
    const categoriesMap = new Map();
    
    jsonData.forEach(product => {
      if (product.topCategoryId && product.topCategoryName && product.topCategoryName !== '') {
        categoriesMap.set(product.topCategoryId, product.topCategoryName);
      }
    });
    
    console.log(`Found ${categoriesMap.size} unique categories`);
    
    // Convert to array for insertion
    const categories = Array.from(categoriesMap, ([vendor_id, category_name], index) => ({
      vendor_id: vendor_id,
      category_name: category_name,
      store_name: 'Colruyt',
      category_order: index + 1
    }));
    
    // Insert categories one by one with better error handling
    let inserted = 0;
    let failed = 0;
    
    for (const category of categories) {
      try {
        const { data, error } = await supabase
          .from('store_categories')
          .upsert(category, { 
            onConflict: 'vendor_id,store_name',
            ignoreDuplicates: false 
          });
        
        if (error) {
          console.error(`Error inserting category ${category.category_name}:`, error.message);
          failed++;
        } else {
          inserted++;
          console.log(`Inserted: ${category.category_name} (${inserted}/${categories.length})`);
        }
      } catch (err) {
        console.error(`Failed to insert ${category.category_name}:`, err.message);
        failed++;
      }
    }
    
    console.log(`\nSummary: ${inserted} inserted, ${failed} failed out of ${categories.length} total`);
    
    console.log('Category import completed!');
    
    // Show sample of imported categories
    const { data: sampleCategories } = await supabase
      .from('store_categories')
      .select('*')
      .eq('store_name', 'Colruyt')
      .limit(5);
    
    console.log('Sample imported categories:', sampleCategories);
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import
importCategories();