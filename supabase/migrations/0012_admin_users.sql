-- Admin/staff access control. Only emails listed here can get past the
-- admin middleware, regardless of whether they can create a Clerk account.
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'manager' check (role in ('owner', 'manager')),
  clerk_user_id text unique,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index idx_admin_users_email on admin_users (lower(email));

insert into admin_users (email, role, accepted_at)
values ('shavaloandriy1@gmail.com', 'owner', now());
