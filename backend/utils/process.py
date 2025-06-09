import pandas as pd
import os
import requests
import json
from urllib.parse import urlparse

# Create images directory
os.makedirs('images', exist_ok=True)

# Read CSV
df = pd.read_csv('data/fashion_data.csv')

# Initialize columns
df['selling_price'] = df.get('selling_price', '')
df['mrp'] = df.get('mrp', '')
df['feature_image_s3'] = df.get('feature_image_s3', '')

# Process each row
for idx, row in df.iterrows():

    # Download image
    if row['feature_image_s3']:
        try:
            # Get filename from URL
            parsed_url = urlparse(row['feature_image_s3'])
            filename = os.path.basename(parsed_url.path)
            local_path = f'images/{filename}'
            
            # Download only if not already present
            if not os.path.exists(local_path):
                response = requests.get(row['feature_image_s3'], timeout=10)
                response.raise_for_status()
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                print(f"Downloaded image for {row['product_id']}: {local_path}")
            
            # Update feature_image_s3 to local path
            df.at[idx, 'feature_image_s3'] = local_path
        except Exception as e:
            print(f"Row {idx}: Failed to download image {row['feature_image_s3']}: {e}")
            df.at[idx, 'feature_image_s3'] = ''

# Save modified CSV
df.to_csv('data/fashion_data.csv', index=False)
print("Modified CSV saved to data/jeans_bd_processed_data_fixed.csv")