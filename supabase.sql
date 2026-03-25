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

create or replace view public.inventory_items as
select
  i.*,
  greatest(i.quantity - coalesce(i.sold_quantity, 0), 0) as remaining,
  (i.cost_price * i.quantity) as total_cost,
  ((i.sell_price - i.cost_price) * least(coalesce(i.sold_quantity, 0), i.quantity)) as realized_profit,
  ((i.sell_price - i.cost_price) * greatest(i.quantity - coalesce(i.sold_quantity, 0), 0)) as potential_revenue,
  (i.market_price * greatest(i.quantity - coalesce(i.sold_quantity, 0), 0)) as market_value,
  case
    when i.cost_price > 0
      then (((i.sell_price - i.cost_price) / i.cost_price) * 100)
    else 0
  end as profit_margin
from public.items i;

create or replace function public.inventory_summary()
returns table (
  total_products bigint,
  total_units bigint,
  sold_units bigint,
  remaining_units bigint,
  total_cost numeric,
  realized_profit numeric,
  estimated_total_profit numeric,
  remaining_market_value numeric,
  remaining_sale_value numeric,
  low_stock_count bigint
)
language sql
stable
as $$
  select
    count(*)::bigint as total_products,
    coalesce(sum(quantity), 0)::bigint as total_units,
    coalesce(sum(sold_quantity), 0)::bigint as sold_units,
    coalesce(sum(greatest(quantity - coalesce(sold_quantity, 0), 0)), 0)::bigint as remaining_units,
    coalesce(sum(cost_price * quantity), 0) as total_cost,
    coalesce(sum((sell_price - cost_price) * least(coalesce(sold_quantity, 0), quantity)), 0) as realized_profit,
    coalesce(sum((sell_price - cost_price) * quantity), 0) as estimated_total_profit,
    coalesce(sum(market_price * greatest(quantity - coalesce(sold_quantity, 0), 0)), 0) as remaining_market_value,
    coalesce(sum(sell_price * greatest(quantity - coalesce(sold_quantity, 0), 0)), 0) as remaining_sale_value,
    coalesce(sum(
      case
        when greatest(quantity - coalesce(sold_quantity, 0), 0) between 1 and 3 then 1
        else 0
      end
    ), 0)::bigint as low_stock_count
  from public.items;
$$;

alter table public.items enable row level security;
alter table public.sales enable row level security;

drop policy if exists "allow anon full access on items" on public.items;
drop policy if exists "allow anon full access on sales" on public.sales;

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
