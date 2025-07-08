import fs from 'fs';
import https from 'https';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Supabase client with service role key
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Categories to skip (non-food)
const SKIP_CATEGORIES = [
  'Niet-voeding',
  'Onderhoud/Huishouden', 
  'Lichaamsverzorging/Parfumerie',
  'Baby', // Mostly non-food
  'Huisdieren' // Pet food
];

// Keywords that indicate non-recipe products
const SKIP_KEYWORDS = [
  'shampoo', 'zeep', 'wasmiddel', 'toiletpapier', 'keukenrol',
  'vuilniszak', 'luiers', 'tandpasta', 'douchegel', 'afwasmiddel'
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
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

// Check if product is relevant for recipes
function isRecipeRelevant(product) {
  // Skip non-food categories
  if (SKIP_CATEGORIES.includes(product.topCategoryName)) {
    return false;
  }
  
  // Skip products with non-food keywords
  const lowerName = product.LongName.toLowerCase();
  if (SKIP_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    return false;
  }
  
  return true;
}

// Main import function
async function importProducts() {
  try {
    console.log('Reading Colruyt JSON file...');
    const jsonData = JSON.parse(fs.readFileSync('scripts/colruyt_2024-06-15-08-18-48.json', 'utf8'));
    
    // Get category mappings
    const { data: categories } = await supabase
      .from('store_categories')
      .select('id, vendor_id')
      .eq('store_name', 'Colruyt');
    
    const categoryMap = new Map();
    categories.forEach(cat => categoryMap.set(cat.vendor_id, cat.id));
    
    // Process in batches
    const batchSize = 10;
    const tempImagePath = '/tmp/product_temp.jpg';
    let processedCount = 0;
    let skippedCount = 0;
    
    // Filter to first 100 products for testing
    const productsToProcess = jsonData.slice(0, 100);
    
    for (let i = 0; i < productsToProcess.length; i += batchSize) {
      const batch = productsToProcess.slice(i, i + batchSize);
      console.log(`\nProcessing batch ${i/batchSize + 1} (${i} to ${Math.min(i + batchSize, productsToProcess.length)})...`);
      
      for (const product of batch) {
        // Skip if no category mapping
        if (!categoryMap.has(product.topCategoryId)) {
          console.log(`Skipping ${product.LongName} - no category mapping`);
          skippedCount++;
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
          english_descriptions: []
        };
        
        // Generate English descriptions for recipe-relevant products
        if (isRecipeRelevant(product)) {
          console.log(`\nAnalyzing: ${product.LongName}`);
          console.log(`Category: ${product.topCategoryName}`);
          
          try {
            // Download image
            await downloadImage(product.thumbNail, tempImagePath);
            console.log('Image downloaded, ready for analysis');
            
            // Pause for manual analysis
            console.log('\n--- MANUAL ANALYSIS NEEDED ---');
            console.log(`Product: ${product.LongName}`);
            console.log(`Category: ${product.topCategoryName}`);
            console.log(`Image: ${tempImagePath}`);
            console.log('Please analyze and provide English descriptions...');
            console.log('--- Press Enter to continue with empty descriptions ---\n');
            
            // For now, we'll use empty descriptions
            // In actual use, this is where AI analysis would happen
            productData.english_descriptions = [];
            
            // Clean up image
            if (fs.existsSync(tempImagePath)) {
              fs.unlinkSync(tempImagePath);
            }
          } catch (err) {
            console.error(`Error processing image: ${err.message}`);
          }
        } else {
          console.log(`Skipping image analysis for: ${product.LongName} (non-recipe product)`);
        }
        
        // Insert product
        const { error } = await supabase
          .from('products')
          .insert(productData);
        
        if (error) {
          console.error(`Error inserting ${product.LongName}:`, error.message);
        } else {
          processedCount++;
        }
      }
    }
    
    console.log(`\n=== Import Summary ===`);
    console.log(`Total processed: ${processedCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Failed: ${productsToProcess.length - processedCount - skippedCount}`);
    
  } catch (error) {
    console.error('Import failed:', error);
  }
}

// Run the import
importProducts();