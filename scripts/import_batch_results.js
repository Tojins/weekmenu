import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

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
      "descriptions": ["olive tomato cheese", "mediterranean cheese", "cheese with olives and tomatoes"]
    },
    {
      "index": 2, 
      "name": "kippenborst 500g",
      "descriptions": ["chicken breast", "boneless chicken", "raw chicken breast"]
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
    const jsonData = JSON.parse(fs.readFileSync('scripts/colruyt_2024-06-15-08-18-48.json', 'utf8'));
    
    // Get category mappings
    const { data: categories } = await supabase
      .from('store_categories')
      .select('id, vendor_id')
      .eq('store_name', 'Colruyt');
    
    const categoryMap = new Map();
    categories.forEach(cat => categoryMap.set(cat.vendor_id, cat.id));
    
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
        english_descriptions: result.descriptions || []
      };
      
      // Insert product
      const { error } = await supabase
        .from('products')
        .insert(productData);
      
      if (error) {
        console.error(`❌ Error inserting ${product.LongName}:`, error.message);
      } else {
        console.log(`✓ Imported: ${product.LongName}`);
        console.log(`  Descriptions: [${result.descriptions.join(', ')}]`);
        importedCount++;
      }
    }
    
    console.log(`\\n✅ Import complete! Imported ${importedCount} products.`);
    
    // Clean up
    const cleanup = await askConfirm('Clean up batch files? (y/N): ');
    if (cleanup) {
      fs.rmSync(batchDir, { recursive: true, force: true });
      console.log('Batch files cleaned up.');
    }
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

async function askConfirm(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Run import
importBatchResults();