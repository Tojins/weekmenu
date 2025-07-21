# Store Categories Rework Specification

## Overview

This document outlines the plan to restructure the current store categories system to support multiple store chains (e.g., Colruyt, Delhaize, Albert Heijn) and their physical store locations, with customizable category ordering per store.

## Current State

### Existing store_categories table
```sql
store_categories
├── id (UUID, PK)
├── store_name (TEXT NOT NULL)
├── category_name (TEXT NOT NULL)
├── category_order (INTEGER NOT NULL)
├── vendor_id (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Constraints:
- UNIQUE(store_name, category_name)
- UNIQUE(vendor_id, store_name)
```

### Issues with Current Design
1. **store_name** conflates chain and location (e.g., "Colruyt" could be the chain or a specific store)
2. **category_order** is at the wrong level - assumes all stores in a chain have same ordering
3. **vendor_id** purpose is unclear and potentially redundant
4. No support for multiple physical locations of the same chain
5. No way to customize category ordering per physical store

## Proposed New Design

### 1. store_chains table
Represents retail chains (e.g., Colruyt, Delhaize)

```sql
store_chains
├── id (UUID, PK)
├── name (TEXT NOT NULL, UNIQUE)
├── logo_url (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### 2. stores table
Represents physical store locations

```sql
stores
├── id (UUID, PK)
├── store_chain_id (UUID NOT NULL, FK → store_chains.id)
├── name (TEXT NOT NULL)  -- e.g., "Colruyt Leuven"
├── address (TEXT)
├── city (TEXT)
├── postal_code (TEXT)
├── is_active (BOOLEAN DEFAULT true)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Constraints:
- UNIQUE(store_chain_id, name)
```

### 3. store_categories table (reworked)
Categories at the chain level

```sql
store_categories
├── id (UUID, PK)
├── store_chain_id (UUID NOT NULL, FK → store_chains.id)
├── category_name (TEXT NOT NULL)
├── external_id (TEXT)  -- renamed vendor_id for external system references
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Constraints:
- UNIQUE(store_chain_id, category_name)
- UNIQUE(store_chain_id, external_id) -- if external_id is not null
```

### 4. store_ordering table
Defines category ordering per physical store

```sql
store_ordering
├── id (UUID, PK)
├── store_id (UUID NOT NULL, FK → stores.id)
├── store_category_id (UUID NOT NULL, FK → store_categories.id)
├── display_order (INTEGER NOT NULL)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Constraints:
- UNIQUE(store_id, store_category_id)
- UNIQUE(store_id, display_order)
```

## Migration Plan

### Phase 1: Create New Tables
1. Create `store_chains` table
2. Create new `stores` table
3. Create `store_ordering` table

### Phase 2: Alter tables
1. Alter `store_categories` with updated schema:
   - Add `store_chain_id` column (FK to store_chains.id)
   - Rename `vendor_id` column to `external_id`
   - Drop `store_name` column
   - Drop `category_order` column

### Phase 3: Migrate Data
1. Insert Colruyt as first store chain
2. Insert Colruyt Linkeroever as first store
