-- krosofki_world: remove the temporary 0-stock test variant used to verify
-- the quantity-clamp fix in ProductPurchasePanel — dev-only cleanup.
delete from product_variants where sku = 'street-runner-black-42-blue-test';
