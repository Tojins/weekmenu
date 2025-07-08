# Product Batch Import Workflow

## Overview
This workflow imports products from Colruyt with AI-generated English descriptions for ingredients only.

## Steps

### 1. Prepare Batch
```bash
node scripts/prepare_products_batch.js
```
Downloads 5 product images to `./temp/product_batch/`

### 2. Review Products
Check `./temp/product_batch/batch_info.json` and decide which products need English descriptions:
- ✅ **Generate descriptions for:** Raw ingredients (vegetables, meat, fish, dairy, spices) and recipe components (oil, flour, broth, sauces, pesto)
- ❌ **Skip descriptions for:** Prepared foods (pizza, lasagna, ready meals) and snacks/drinks (chips, cookies, soda)

### 3. Generate Descriptions
For products that need descriptions:
1. Read the product image file
2. Generate 3-5 English descriptions following these rules:
   - Translate literally - no marketing terms
   - Create variations using synonyms, singular/plural, category levels
   - Pattern: exact translation → synonyms → singular/plural → category up → cut/form

For products that don't need descriptions, use empty array.

Create `./temp/product_batch/batch_results.json`:
```json
{
  "products": [
    {"index": 1, "name": "kipfilet 500g", "descriptions": ["chicken breast", "chicken fillet", "chicken"]},
    {"index": 2, "name": "Pizza Margherita", "descriptions": []}
  ]
}
```

### 4. Import to Database
```bash
node scripts/import_batch_results.js
```

## Description Rules

### Do
- Synonyms: `tomaat`→tomato/tomatoes, `ui`→onion/onions
- Category levels: `kipfilet`→["chicken breast", "chicken fillet", "chicken"]
- Forms: `sneden`→sliced/strips, `gehakt`→ground/minced

### Don't
- ❌ Marketing terms: "premium", "fresh", "organic" (unless stated)
- ❌ Usage suggestions: "stir-fry vegetables", "grilling meat"
- ❌ Origin/style: "mediterranean", "asian" (unless stated)

### Examples
- `"rode paprika"` → ["red pepper", "red bell pepper", "bell pepper", "pepper"]
- `"kipfilet"` → ["chicken breast", "chicken fillet", "chicken", "poultry"]
- `"gehakt rund"` → ["ground beef", "minced beef", "beef mince", "beef"]