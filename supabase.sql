create extension if not exists pgcrypto;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default '',
  sku text default '',
  supplier text default '',
  cost_price numeric(12,2) default 0,
  market_price numeric(12,2) default 0,
  sell_price numeric(12,2) default 0,
  quantity integer not null default 0,
  sold_quantity integer not null default 0,
  location text default '',
  note text default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  item_name text not null,
  quantity integer not null default 1,
  sale_price numeric(12,2) not null default 0,
  cost_price numeric(12,2) not null default 0,
  revenue numeric(12,2) not null default 0,
  profit numeric(12,2) not null default 0,
  note text default '',
  sold_at timestamptz not null default now()
);

create index if not exists idx_items_updated_at on public.items(updated_at desc);
create index if not exists idx_sales_sold_at on public.sales(sold_at desc);
create index if not exists idx_sales_item_id on public.sales(item_id);

alter table public.items enable row level security;
alter table public.sales enable row level security;

create policy "allow anon full access on items"
on public.items
for all
to anon, authenticated
using (true)
with check (true);

create policy "allow anon full access on sales"
on public.sales
for all
to anon, authenticated
using (true)
with check (true);
