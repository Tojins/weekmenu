import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: './.env.local' });

// Create Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Example results format
const EXAMPLE_FORMAT = `
// Example format for batch_results.json:
{
  "products": [
    {
      "index": 1,
      "name": "LANDANA kaas olijf-tomaat 150g",
      "description": "cheese"
    },
    {
      "index": 2, 
      "name": "kippenborst 500g",
      "description": "chicken"
    }
  ]
}
`;

async function importBatchResults() {
  try {
    const batchDir = './temp/product_batch';
    const resultsFile = `${batchDir}/batch_results.json`;
    
    // Check if results file exists
    if (!fs.existsSync(resultsFile)) {
      console.log('No batch_results.json found!');
      console.log(`\\nPlease create: ${resultsFile}`);
      console.log(EXAMPLE_FORMAT);
      return;
    }
    
    // Read batch info and results
    const batchInfo = JSON.parse(fs.readFileSync(`${batchDir}/batch_info.json`, 'utf8'));
    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    
    // Read original product data
    const jsonData = JSON.parse(fs.readFileSync('./scripts/colruyt_2024-06-15-08-18-48.json', 'utf8'));
    
    // Read seasonal data
    const seasonalData = JSON.parse(fs.readFileSync('./scripts/seasonal_produce.json', 'utf8'));
    
    // Get category mappings
    const { data: categories } = await supabase
      .from('store_categories')
      .select('id, vendor_id')
      .eq('store_name', 'Colruyt');
    
    const categoryMap = new Map();
    categories.forEach(cat => categoryMap.set(cat.vendor_id, cat.id));
    
    // Function to find seasonal info by partial name match (removed - rely on AI instead)
    function findSeasonalInfo(productName) {
      // No fallback auto-matching - only use explicit seasonal_key from AI analysis
      return null;
    }
    
    // Process each result
    let importedCount = 0;
    
    for (const result of results.products) {
      const batchProduct = batchInfo.products.find(p => p.index === result.index);
      if (!batchProduct) {
        console.log(`⚠️  No batch info for index ${result.index}`);
        continue;
      }
      
      // Find original product data
      const product = jsonData.find(p => 
        p.LongName === batchProduct.name && 
        p.brand === batchProduct.brand
      );
      
      if (!product) {
        console.log(`⚠️  Product not found: ${batchProduct.name}`);
        continue;
      }
      
      // Skip if no category mapping
      if (!categoryMap.has(product.topCategoryId)) {
        console.log(`⚠️  No category mapping for: ${product.LongName}`);
        continue;
      }
      
      // Find seasonal information (unless overridden)
      let seasonalInfo = null;
      if (!result.override_seasonal) {
        if (result.seasonal_key) {
          // Use provided seasonal key
          seasonalInfo = seasonalData[result.seasonal_key] || null;
        } else {
          // Fall back to automatic matching
          seasonalInfo = findSeasonalInfo(product.LongName);
        }
      }
      
      // Prepare product data
      const productData = {
        name: product.LongName,
        unit: product.content,
        image_url: product.thumbNail,
        unit_price: product.price.basicPrice,
        normalized_price: product.price.measurementUnitPrice,
        isweightarticle: product.IsWeightArticle,
        brand: product.brand,
        store_category_id: categoryMap.get(product.topCategoryId),
        walkroutesequencenumber: product.walkRouteSequenceNumber,
        english_description: result.description || null,
        season_start_month: seasonalInfo?.season_start_month || null,
        season_end_month: seasonalInfo?.season_end_month || null
      };
      
      // Insert product and get the ID
      const { data: insertedProduct, error } = await supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single();
      
      if (error) {
        console.error(`❌ Error inserting ${product.LongName}:`, error.message);
      } else {
        // Copy image to persistent cache
        const tempImagePath = batchProduct.imageFile;
        const persistentImagePath = `./images/${insertedProduct.id}.jpg`;
        
        if (fs.existsSync(tempImagePath)) {
          if (!fs.existsSync('./images')) {
            fs.mkdirSync('./images', { recursive: true });
          }
          fs.copyFileSync(tempImagePath, persistentImagePath);
        }
        
        console.log(`✓ Imported: ${product.LongName}`);
        console.log(`  Description: ${result.description || 'none'}`);
        if (result.override_seasonal) {
          console.log(`  Season: overridden (not a raw fruit/vegetable)`);
        } else if (seasonalInfo) {
          const source = result.seasonal_key ? `via key "${result.seasonal_key}"` : 'auto-matched';
          console.log(`  Season: ${seasonalInfo.season_start_month} - ${seasonalInfo.season_end_month} (${source})`);
        }
        importedCount++;
      }
    }
    
    console.log(`\\n✅ Import complete! Imported ${importedCount} products.`);
    
    // Clean up - check for --no-cleanup flag to disable default cleanup
    const shouldNotCleanup = process.argv.includes('--no-cleanup');
    if (!shouldNotCleanup) {
      fs.rmSync(batchDir, { recursive: true, force: true });
      console.log('Batch files cleaned up automatically.');
    } else {
      console.log('Batch files preserved (--no-cleanup flag used).');
    }
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run import
importBatchResults();