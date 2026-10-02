UPDATE shop_products SET price = REPLACE(price, ' · ilustrativo', '') WHERE price LIKE '% · ilustrativo';
