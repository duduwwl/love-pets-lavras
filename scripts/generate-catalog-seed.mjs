import { readFileSync, writeFileSync } from 'node:fs';

const catalogPath = 'public/products.json';
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
const quote = value => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const columns = ['id','name','category','description','usage','selection','care','image','price','available','stock_quantity','illustrative','image_col','image_row','image_cols','image_rows'];
const statements = catalog.map((item, index) => {
  item.id ||= `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`;
  const values = [item.id,item.name,item.category,item.description,item.usage,item.selection,item.care,item.image,null,1,null,1,item.col,item.row,item.cols,item.rows];
  return `INSERT OR IGNORE INTO shop_products (${columns.join(', ')}) VALUES (${values.map(quote).join(', ')});`;
});
writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
writeFileSync('drizzle/0002_catalog_inventory.sql', [
  'ALTER TABLE shop_products ADD COLUMN stock_quantity integer;',
  'ALTER TABLE shop_products ADD COLUMN illustrative integer NOT NULL DEFAULT 0;',
  'ALTER TABLE shop_products ADD COLUMN image_col integer;',
  'ALTER TABLE shop_products ADD COLUMN image_row integer;',
  'ALTER TABLE shop_products ADD COLUMN image_cols integer;',
  'ALTER TABLE shop_products ADD COLUMN image_rows integer;',
  ...statements,
].join('\n--> statement-breakpoint\n') + '\n');
console.log(`Prepared ${catalog.length} catalog products for stock management.`);
