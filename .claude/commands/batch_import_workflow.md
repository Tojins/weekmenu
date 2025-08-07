# Product Batch Import Workflow

## Overview
This workflow imports products from Colruyt with AI-generated English description (single word) for ingredients only.

## Steps

**IMPORTANT**: All commands must be run from the project root directory (`/home/unixuser/weekmenu/`), not from the scripts directory.

### 1. Prepare Batch
```bash
node scripts/prepare_products_batch.js
```
Downloads 200 product images to `./images/` (persistent cache) and creates batch info in `./temp/product_batch/`

### 2. Review Products
Check `./temp/product_batch/batch_info.json` and decide which products need English descriptions:
- ✅ **Generate descriptions for:** Raw ingredients (vegetables, meat, fish, dairy, spices) and recipe components (oil, flour, broth, sauces, pesto)
- ❌ **Skip descriptions for:** Prepared foods (pizza, lasagna, ready meals) and snacks/drinks (chips, cookies, soda)

### 3. Generate Descriptions
For products that need descriptions:
1. Read the product image file from `./images/{product_id}.jpg`
2. Generate a single, simple English description following these rules:
   - One word only, generic and basic
   - Use the most common English term
   - No marketing terms or adjectives
3. **Seasonal Matching**: If the product is an actual raw fruit or vegetable, provide a `seasonal_key` that matches the Dutch names in the seasonal data (e.g., "druiven" → `seasonal_key: "druif"`, "tomaten" → `seasonal_key: "tomaat"`)
4. **Important**: If the product is NOT an actual fruit or vegetable (e.g., fruit-flavored yogurt, tomato sauce, etc.), set `override_seasonal: true` to prevent automatic seasonal matching

For products that don't need descriptions, use null.

Create `./temp/product_batch/batch_results.json`:
```json
{
  "products": [
    {"index": 1, "name": "kipfilet 500g", "description": "chicken"},
    {"index": 2, "name": "Pizza Margherita", "description": null},
    {"index": 3, "name": "ALPRO perzik yogurt 500g", "description": null, "override_seasonal": true},
    {"index": 4, "name": "BONI blauwe druiven pitloos 400g", "description": "druif", "seasonal_key": "druif"},
    {"index": 5, "name": "verse tomaten 500g", "description": "tomato", "seasonal_key": "tomaat"}
  ]
}
```

### 4. Import to Database
```bash
node scripts/import_batch_results.js --cleanup
```
Imports products with English descriptions and seasonal information. Uses `seasonal_key` when provided, otherwise falls back to automatic matching against `seasonal_produce.json`. Season fields are set to null if no match is found.

Use `--cleanup` flag to automatically remove batch files after successful import. This removes the `./temp/product_batch/` directory but keeps the `./images/` directory for persistent caching.

**Available seasonal keys** (from `scripts/seasonal_produce.json`):
- Vegetables: `aardpeer`, `andijvie`, `artisjok`, `asperge`, `aubergine`, `bloemkool`, `broccoli`, `courgette`, `groene selder`, `groenekool`, `knolselder`, `koolrabi`, `komkommer`, `kropsla`, `lente-ui`, `mais`, `paprika`, `pastinaak`, `peterseliewortel`, `peultjes`, `pompoen`, `prei`, `prinsessenboon`, `raap`, `radijs`, `rammenas`, `rode biet`, `rodekool`, `schorseneer`, `snijboon`, `spinazie`, `spitskool`, `spruiten`, `tomaat`, `veldsla`, `venkel`, `witte selder`, `witloof`, `wittekool`, `wortel`
- Fruits: `aalbes`, `aardbeien`, `abrikoos`, `appel`, `blauwe bes`, `braambes`, `citroen`, `clementine`, `druif`, `framboos`, `kers`, `kiwi`, `mandarijn`, `meloen`, `nectarine`, `peer`, `perzik`, `pruim`, `rabarber`, `sinaasappel`, `stekelbes`, `watermeloen`

## Description Rules

### Do
- Use one word only
- Choose the most basic, common English term
- Use generic ingredient names

### Don't
- ❌ Multiple words: "chicken breast" → use "chicken"
- ❌ Marketing terms: "premium", "fresh", "organic"
- ❌ Adjectives: "red", "fresh", "sliced"
- ❌ Brand names or specific varieties

### Examples
- `"rode paprika"` → "pepper"
- `"kipfilet"` → "chicken"
- `"gehakt rund"` → "beef"
- `"witte ui"` → "onion"
- `"verse basilicum"` → "basil"