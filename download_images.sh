#\!/bin/bash

source .env.local

mkdir -p images

psql "postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres" -t -c "SELECT id, image_url FROM products WHERE english_description IS NOT NULL AND image_url IS NOT NULL;"  < /dev/null |  while IFS='|' read -r id image_url; do
    id=$(echo "$id" | xargs)
    image_url=$(echo "$image_url" | xargs)
    
    if [[ -z "$id" || -z "$image_url" ]]; then
        continue
    fi
    
    # Skip if image already exists
    if [[ -f "images/${id}.jpg" ]]; then
        echo "Skipping $id (already exists)"
        continue
    fi
    
    echo "Downloading $id..."
    curl -s -o "images/${id}.jpg" "$image_url"
    
    if [[ $? -eq 0 ]]; then
        echo "Successfully downloaded images/${id}.jpg"
    else
        echo "Failed to download $id"
    fi
done

echo "Download complete\!"
