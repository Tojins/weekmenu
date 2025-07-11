#!/bin/bash

# Update all menu-selector test files to use the auth mock helper

for file in tests/menu-selector-*.spec.js; do
  if [ -f "$file" ]; then
    echo "Updating $file..."
    
    # Add import at the top if not already present
    if ! grep -q "import { mockAuth }" "$file"; then
      sed -i "1s/^/import { mockAuth } from '.\/helpers\/auth-mock.js';\n/" "$file"
    fi
    
    # Replace the auth mocking code in beforeEach
    sed -i '/\/\/ Mock auth session/,/});[[:space:]]*});/c\    \/\/ Setup auth mocking\n    await mockAuth(page);' "$file"
    
    # Remove any remaining auth route mocking
    sed -i '/await page.route.*auth\/v1\/user/,/});/d' "$file"
  fi
done

echo "Done updating test files!"