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

async function testImport() {
  try {
    console.log('Testing product import with 3 food products...\n');
    const jsonData = JSON.parse(fs.readFileSync('scripts/colruyt_2024-06-15-08-18-48.json', 'utf8'));
    
    // Get category mappings
    const { data: categories } = await supabase
      .from('store_categories')
      .select('id, vendor_id, category_name')
      .eq('store_name', 'Colruyt');
    
    const categoryMap = new Map();
    categories.forEach(cat => categoryMap.set(cat.vendor_id, cat));
    
    // Find 3 food products from different categories
    const testProducts = [];
    const wantedCategories = ['Zuivel', 'Groenten en fruit', 'Vlees'];
    
    for (const catName of wantedCategories) {
      const product = jsonData.find(p => p.topCategoryName === catName && p.isAvailable);
      if (product) testProducts.push(product);
    }
    
    console.log(`Found ${testProducts.length} test products\n`);
    
    const tempImagePath = '/tmp/product_test.jpg';
    
    for (const product of testProducts) {
      const category = categoryMap.get(product.topCategoryId);
      if (!category) continue;
      
      console.log('='*50);
      console.log(`Product: ${product.LongName}`);
      console.log(`Brand: ${product.brand}`);
      console.log(`Category: ${product.topCategoryName}`);
      console.log(`Unit: ${product.content}`);
      console.log(`Price: €${product.price.basicPrice}`);
      
      // Download image
      console.log('\nDownloading image...');
      await downloadImage(product.thumbNail, tempImagePath);
      console.log(`Image saved to: ${tempImagePath}`);
      console.log('Ready for AI analysis!');
      
      // This is where you'll analyze the image
      // For now, let's pause
      console.log('\n[Waiting for analysis...]\n');
      
      // Clean up
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImport();