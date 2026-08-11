-- krosofki_world: drop the earlier placeholder schema before laying down
-- the real one in 0001. Authorized cleanup of a throwaway starter project.
drop table if exists order_items cascade;
drop table if exists orders cascade;
drop table if exists products cascade;
drop table if exists categories cascade;
drop table if exists staff_chat_links cascade;
drop table if exists staff_chats cascade;
drop table if exists shop_settings cascade;
