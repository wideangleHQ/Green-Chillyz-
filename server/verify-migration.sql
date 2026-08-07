-- Verify price columns were added and data was migrated
SELECT 
  COUNT(*) as total_items,
  COUNT(*) FILTER (WHERE price > 0) as items_with_price,
  COUNT(*) FILTER (WHERE discounted_price IS NOT NULL) as items_with_discount,
  COUNT(*) FILTER (WHERE metadata->>'price' IS NOT NULL) as items_had_metadata_price,
  AVG(price::numeric) as avg_price,
  MIN(price::numeric) as min_price,
  MAX(price::numeric) as max_price
FROM menu_items;

-- Show a sample of migrated items
SELECT 
  id,
  name,
  price,
  discounted_price,
  metadata->>'price' as old_metadata_price
FROM menu_items
LIMIT 10;
