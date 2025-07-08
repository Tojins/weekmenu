# Colruyt JSON to Products Table Mapping

## Field Mapping

| Colruyt JSON | Products Table | Type | Notes |
|--------------|----------------|------|-------|
| `LongName` | `name` | Direct |  |
| `content` | `unit` | Direct |  |
| `thumbNail` | `image_url` | Direct |  |
| `price.basicPrice` | `unit_price` | Direct |  |
| `price.measurementUnitPrice` | `normalized_price` | Direct |  |
| `IsWeightArticle` | `isweightarticle` | Direct |  |
| `brand` | `brand` | Direct |  |
| `topCategoryName` | `store_category_id` | Lookup | Find ID by name in store_categories |
| `walkRouteSequenceNumber` | `walkroutesequencenumber` | Direct |  |

## Category Lookup
```sql
SELECT id FROM store_categories WHERE name = [topCategoryName]
```