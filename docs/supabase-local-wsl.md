# Local Supabase on WSL Ubuntu

## Prerequisites

1. **Docker Desktop for Windows**
   - Install Docker Desktop and enable WSL 2 integration
   - In Docker Desktop settings → Resources → WSL Integration → Enable for your Ubuntu distro
   - This is the easiest approach

2. **Alternative: Docker in WSL2** (if you prefer not using Docker Desktop)
   ```bash
   # Install Docker in WSL
   sudo apt update
   sudo apt install docker.io docker-compose
   sudo usermod -aG docker $USER
   # Restart WSL after this
   ```

## Installation

```bash
# Install Supabase CLI
npm install -g supabase

# Or using Homebrew (works in WSL)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

## Setup Local Supabase

```bash
# In your project directory
cd /home/unixuser/weekmenu

# Initialize Supabase (if not already done)
supabase init

# Start local Supabase
supabase start
```

This will spin up:
- PostgreSQL database (port 54322)
- Auth server (port 54321)
- Storage API (port 54323)
- Studio UI (port 54323)
- Additional services

## WSL-Specific Considerations

### 1. Performance
- WSL2 file system performance is good for database operations
- Keep your project files in the WSL filesystem (`/home/user/...`), NOT in `/mnt/c/...`
- Database will run inside Docker containers

### 2. Accessing Services
```bash
# From WSL terminal
supabase status

# You'll get URLs like:
# Studio URL: http://localhost:54323
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
```

These URLs work from:
- WSL terminal ✓
- Windows browser ✓ (WSL2 automatically forwards localhost)
- VS Code in WSL ✓

### 3. Memory Usage
Docker Desktop handles memory allocation well, but you can configure limits:

```bash
# Create/edit ~/.wslconfig in Windows (not WSL)
# C:\Users\YourUsername\.wslconfig
[wsl2]
memory=4GB  # Limit WSL2 memory
processors=2 # Limit CPU cores
```

## Setting Up for Testing

### 1. Create Test Configuration

```javascript
// supabase/config.toml
[local]
# Enable local development
enabled = true

[auth]
# Configure test users
enable_signup = true
enable_login = true

[db]
# Database settings
port = 54322
```

### 2. Test Environment Setup

```bash
# .env.test
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key # Get from supabase status
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
```

### 3. Run Migrations Locally

```bash
# Apply all migrations to local DB
supabase db push

# Or reset and reapply
supabase db reset
```

### 4. Seed Test Data

```sql
-- supabase/seed.sql
INSERT INTO stores (name, chain_id) VALUES 
  ('Test Store 1', 'chain-1'),
  ('Test Store 2', 'chain-2');

INSERT INTO products (name, unit_price) VALUES
  ('Test Product 1', 1.99),
  ('Test Product 2', 2.99);
```

```bash
# Run seed
supabase db seed
```

## Testing Setup

```javascript
// playwright.config.js
export default defineConfig({
  use: {
    baseURL: 'http://localhost:5173',
  },
  
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
  
  projects: [
    {
      name: 'local-db',
      use: { 
        // Use local Supabase
        storageState: '.auth/local-user.json'
      },
    },
  ],
});
```

```javascript
// tests/local-db-test.spec.js
test.describe('Local Database Tests', () => {
  test.beforeAll(async () => {
    // Ensure local Supabase is running
    const { execSync } = require('child_process');
    try {
      execSync('supabase status');
    } catch {
      console.error('Local Supabase not running. Run: supabase start');
      process.exit(1);
    }
  });
  
  test('query works without mocking', async ({ page }) => {
    await page.goto('/');
    
    // This will hit your LOCAL database
    const result = await page.evaluate(async () => {
      const { supabase } = window;
      return await supabase
        .from('shopping_list_items')
        .select('*, recipe_id(*)')
        .limit(1);
    });
    
    // Real query, real results!
    expect(result.error).toBeNull();
  });
});
```

## Common Issues & Solutions

### 1. Port Conflicts
```bash
# If ports are in use
supabase stop
docker ps # Check for running containers
docker stop $(docker ps -q) # Stop all containers
supabase start
```

### 2. Docker Not Running
```bash
# Check Docker status
docker version

# If Docker daemon not running in WSL (without Docker Desktop)
sudo service docker start
```

### 3. Slow Performance
- Ensure files are in WSL filesystem, not Windows mounted drives
- Allocate more memory to WSL2 if needed
- Use Docker Desktop's WSL2 backend (recommended)

## Benefits for Your Testing

1. **Real query validation** - Would have caught the `recipes:recipe_id(name)` error
2. **RLS policy testing** - Test actual row-level security
3. **Fast iterations** - Reset database quickly between tests
4. **Isolated environment** - No risk to production data
5. **Consistent state** - Migrations and seeds ensure predictable data

## Quick Start Commands

```bash
# Start everything
supabase start

# Check it's working
supabase status

# Run your tests against local DB
npm test -- --grep "Local Database"

# Stop when done
supabase stop
```

The local Supabase in WSL would have caught your query error immediately, saving all the debugging time!