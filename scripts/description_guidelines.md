# English Description Guidelines for Product Import

## Core Principles

1. **Stay close to the actual product** - Don't add interpretive or marketing terms
2. **Vary on synonyms and specificity levels** - Not creative expansions
3. **Include category hierarchies** - From specific to general

## Generation Rules

### 1. Extract Core Components
Break down the Dutch name into key components:
- `kaas olijf-tomaat` → cheese + olive + tomato
- `kipfilet sneden` → chicken + fillet + slices

### 2. Generate Variations by:

**A. Synonyms for each component:**
- `kaas` → cheese
- `olijf` → olive, olives
- `tomaat` → tomato, tomatoes
- `kipfilet` → chicken breast, chicken fillet

**B. Different word orders:**
- "olive tomato cheese" 
- "tomato olive cheese"
- "cheese with olives and tomatoes"

**C. Category levels (specific → general):**
- `feta kaas` → ["feta cheese", "feta", "white cheese", "cheese"]
- `kipfilet` → ["chicken breast", "chicken fillet", "chicken", "poultry"]

**D. Preparation states/forms:**
- `sneden` → sliced, strips, pieces, cut
- `gehakt` → ground, minced, mince

### 3. What NOT to do:

❌ **Avoid creative interpretations:**
- "specialty cheese" (too vague)
- "gourmet cheese" (adds marketing)
- "mediterranean cheese" (geographic assumption)

❌ **Don't add cooking suggestions:**
- "pizza cheese" (unless it says pizza)
- "salad vegetables" (unless specifically for salads)

❌ **Don't expand beyond the product:**
- "herb cheese" when only olives/tomatoes mentioned

### 4. Example Corrections:

**Before (too loose):**
```json
"LANDANA kaas olijf-tomaat 150g": [
  "olive tomato cheese", "mediterranean cheese", 
  "cheese with olives and tomatoes", "herb cheese", "specialty cheese"
]
```

**After (strict and varied):**
```json
"LANDANA kaas olijf-tomaat 150g": [
  "olive tomato cheese", "tomato olive cheese",
  "cheese with olives and tomatoes", "cheese with tomatoes and olives",
  "olives and tomatoes cheese"
]
```

### 5. Category Examples:

- **Specific cheese type:** `geitenkaas` → ["goat cheese", "goats cheese", "cheese"]
- **Meat cuts:** `runderlende` → ["beef tenderloin", "beef fillet", "beef", "meat"]
- **Vegetables:** `rode paprika` → ["red pepper", "red bell pepper", "bell pepper", "pepper"]
- **Preparation:** `gesneden brood` → ["sliced bread", "cut bread", "bread"]

## Template Pattern:
1. Most specific term (exact translation)
2. Synonym variations
3. Word order variations  
4. Category level up
5. Preparation state variations

Keep descriptions factual, varied in specificity, but always truthful to the actual product.