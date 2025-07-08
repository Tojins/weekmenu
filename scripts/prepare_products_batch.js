import fs from 'fs';
import https from 'https';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Create Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Categories to focus on
const FOOD_CATEGORIES = [
  'Groenten en fruit',
  'Zuivel', 
  'Vlees',
  'Vis',
  'Brood/Ontbijt',
  'Kruidenierswaren/Droge voeding',
  'Diepvries',
  'Bereidingen/Charcuterie/Vis/Veggie',
  'Conserven'
];

// Download image
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

async function prepareBatch() {
  try {
    const jsonData = JSON.parse(fs.readFileSync('scripts/colruyt_2024-06-15-08-18-48.json', 'utf8'));
    
    // Get existing products to avoid duplicates
    const { data: existingProducts } = await supabase
      .from('products')
      .select('name, brand');
    
    const existingSet = new Set(
      existingProducts.map(p => `${p.name}|${p.brand}`)
    );
    
    // Filter food products that don't exist yet
    const foodProducts = jsonData.filter(p => 
      FOOD_CATEGORIES.includes(p.topCategoryName) &&
      p.isAvailable &&
      !existingSet.has(`${p.LongName}|${p.brand}`)
    );
    
    console.log(`Found ${foodProducts.length} new food products to analyze\\n`);
    
    // Create output directory
    const outputDir = './temp/product_batch';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Prepare batch of 5 products
    const batchSize = 5;
    const batch = foodProducts.slice(0, batchSize);
    
    const batchData = [];
    
    for (let i = 0; i < batch.length; i++) {
      const product = batch[i];
      const imageFile = `${outputDir}/product_${i + 1}.jpg`;
      
      console.log(`Downloading ${i + 1}/${batchSize}: ${product.LongName}`);
      await downloadImage(product.thumbNail, imageFile);
      
      batchData.push({
        index: i + 1,
        name: product.LongName,
        brand: product.brand,
        category: product.topCategoryName,
        unit: product.content,
        imageFile: imageFile
      });
    }
    
    // Write batch info
    const batchInfo = {
      timestamp: new Date().toISOString(),
      products: batchData
    };
    
    fs.writeFileSync(
      `${outputDir}/batch_info.json`,
      JSON.stringify(batchInfo, null, 2)
    );
    
    console.log('\\n=== BATCH READY FOR ANALYSIS ===');
    console.log(`Images saved in: ${outputDir}`);
    console.log('\\nProducts in this batch:');
    
    batchData.forEach(p => {
      console.log(`\\n${p.index}. ${p.name}`);
      console.log(`   Category: ${p.category}`);
      console.log(`   Image: ${p.imageFile}`);
    });
    
    console.log('\\nAnalyze the images and prepare descriptions!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

prepareBatch();