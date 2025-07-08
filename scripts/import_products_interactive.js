import fs from 'fs';
import https from 'https';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Categories to skip (non-food)
const SKIP_CATEGORIES = [
  'Niet-voeding',
  'Onderhoud/Huishouden', 
  'Lichaamsverzorging/Parfumerie',
  'Baby',
  'Huisdieren'
];

// Keywords that indicate non-recipe products
const SKIP_KEYWORDS = [
  'shampoo', 'zeep', 'wasmiddel', 'toiletpapier', 'keukenrol',
  'vuilniszak', 'luiers', 'tandpasta', 'douchegel', 'afwasmiddel',
  'allesreiniger', 'wc', 'bleek', 'vaatwas', 'schoonmaak'
];

// Download image to temp file
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Check if product is relevant for recipes
function isRecipeRelevant(product) {
  if (SKIP_CATEGORIES.includes(product.topCategoryName)) {
    return false;
  }
  
  const lowerName = product.LongName.toLowerCase();
  if (SKIP_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    return false;
  }
  
  return true;
}

// Ask for user input
async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Main import function
async function importProductsInteractive() {
  try {
    console.log('=== Interactive Product Import ===\n');
    
    // Read JSON data
    const jsonData = JSON.parse(fs.readFileSync('scripts/colruyt_2024-06-15-08-18-48.json', 'utf8'));
    
    // Get category mappings
    const { data: categories } = await supabase
      .from('store_categories')
      .select('id, vendor_id, category_name')
      .eq('store_name', 'Colruyt');
    
    const categoryMap = new Map();
    categories.forEach(cat => categoryMap.set(cat.vendor_id, cat));
    
    // Get number of products to process
    const limit = await askQuestion('How many products to import? (default: 10): ');
    const numProducts = parseInt(limit) || 10;
    
    // Get starting offset
    const offset = await askQuestion('Start from product number? (default: 0): ');
    const startIndex = parseInt(offset) || 0;
    
    console.log(`\nProcessing ${numProducts} products starting from index ${startIndex}...\n`);
    
    const tempImagePath = '/tmp/product_current.jpg';
    let importedCount = 0;
    let skippedCount = 0;
    let processedCount = 0;
    
    // Process products
    for (let i = startIndex; i < Math.min(startIndex + numProducts, jsonData.length); i++) {
      const product = jsonData[i];
      processedCount++;
      
      // Skip if no category mapping
      const category = categoryMap.get(product.topCategoryId);
      if (!category) {
        console.log(`⚠️  Skipping - no category mapping for: ${product.LongName}`);
        skippedCount++;
        continue;
      }
      
      // Check if product already exists
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('name', product.LongName)
        .eq('brand', product.brand)
        .single();
      
      if (existing) {
        console.log(`✓ Already exists: ${product.LongName}`);
        skippedCount++;
        continue;
      }
      
      console.log('\\n' + '='.repeat(60));
      console.log(`[${processedCount}/${numProducts}] Processing: ${product.LongName}`);
      console.log('='.repeat(60));
      
      // Prepare base product data
      const productData = {
        name: product.LongName,
        unit: product.content,
        image_url: product.thumbNail,
        unit_price: product.price.basicPrice,
        normalized_price: product.price.measurementUnitPrice,
        isweightarticle: product.IsWeightArticle,
        brand: product.brand,
        store_category_id: category.id,
        walkroutesequencenumber: product.walkRouteSequenceNumber,
        english_descriptions: []
      };
      
      // Check if recipe relevant
      if (!isRecipeRelevant(product)) {
        console.log('→ Non-food product, skipping image analysis');
        const confirm = await askQuestion('Import without descriptions? (y/N): ');
        
        if (confirm.toLowerCase() === 'y') {
          const { error } = await supabase.from('products').insert(productData);
          if (error) {
            console.error(`❌ Error: ${error.message}`);
          } else {
            console.log('✓ Imported (non-food)');
            importedCount++;
          }
        } else {
          skippedCount++;
        }
        continue;
      }
      
      // Download and analyze image for food products
      console.log(`\\nCategory: ${product.topCategoryName}`);
      console.log(`Brand: ${product.brand}`);
      console.log(`Unit: ${product.content}`);
      console.log(`Price: €${product.price.basicPrice}`);
      
      try {
        console.log('\\nDownloading image...');
        await downloadImage(product.thumbNail, tempImagePath);
        console.log(`✓ Image ready: ${tempImagePath}`);
        
        // Wait for AI analysis
        console.log('\\n📸 ANALYZE THE IMAGE NOW');
        console.log('Consider: product name, category, and visual appearance');
        console.log('📋 Follow description_guidelines.md - stay factual, vary on synonyms/specificity');
        console.log('Enter English descriptions (comma-separated), or press Enter to skip:');
        
        const descriptionsInput = await askQuestion('> ');
        
        if (descriptionsInput.trim()) {
          // Parse and clean descriptions
          productData.english_descriptions = descriptionsInput
            .split(',')
            .map(d => d.trim())
            .filter(d => d.length > 0);
          
          console.log(`\\nDescriptions: [${productData.english_descriptions.join(', ')}]`);
          
          // Confirm import
          const confirm = await askQuestion('Import this product? (Y/n): ');
          
          if (confirm.toLowerCase() !== 'n') {
            const { error } = await supabase.from('products').insert(productData);
            if (error) {
              console.error(`❌ Error: ${error.message}`);
            } else {
              console.log('✓ Imported successfully!');
              importedCount++;
            }
          } else {
            skippedCount++;
          }
        } else {
          console.log('→ Skipped (no descriptions provided)');
          skippedCount++;
        }
        
      } catch (err) {
        console.error(`❌ Image error: ${err.message}`);
        skippedCount++;
      } finally {
        // Clean up image
        if (fs.existsSync(tempImagePath)) {
          fs.unlinkSync(tempImagePath);
        }
      }
    }
    
    // Summary
    console.log('\\n' + '='.repeat(60));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total processed: ${processedCount}`);
    console.log(`Imported: ${importedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    
  } catch (error) {
    console.error('\\nImport failed:', error);
  } finally {
    rl.close();
  }
}

// Run the import
importProductsInteractive();