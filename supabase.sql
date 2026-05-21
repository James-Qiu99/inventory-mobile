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
  item_id uuid references public.items(id) on delete set null,
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

grant select on public.inventory_items to anon, authenticated;
grant execute on function public.inventory_summary() to anon, authenticated;

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

-- 1. 登记卖出的原子函数
create or replace function public.register_sale(
  p_item_id uuid,
  p_qty integer,
  p_sale_price numeric,
  p_sold_at timestamptz,
  p_note text
)
returns void
language plpgsql
security definer
as $$
declare
  v_cost_price numeric;
  v_item_name text;
  v_current_sold integer;
  v_total_qty integer;
begin
  -- 1.1 获取商品当前信息并锁定行，防止高并发下超卖
  select name, cost_price, sold_quantity, quantity
  into v_item_name, v_cost_price, v_current_sold, v_total_qty
  from public.items
  where id = p_item_id
  for update;

  if not found then
    raise exception '商品不存在。';
  end if;

  -- 1.2 校验参数合法性
  if p_qty <= 0 then
    raise exception '销售数量必须大于 0。';
  end if;

  if p_sale_price < 0 then
    raise exception '销售单价不能为负数。';
  end if;

  -- 1.3 校验库存是否足够
  if (v_total_qty - v_current_sold) < p_qty then
    raise exception '剩余库存不足，当前剩余 % 件。', (v_total_qty - v_current_sold);
  end if;

  -- 1.3 更新商品信息（更新 sold_quantity 和 note）
  update public.items
  set 
    sold_quantity = sold_quantity + p_qty,
    updated_at = now(),
    note = case 
      when p_note <> '' then 
        coalesce(note || chr(10), '') || '[卖出 ' || p_qty || ' 件 @ ' || p_sale_price || '] ' || p_note
      else note
    end
  where id = p_item_id;

  -- 1.4 写入 sales 表
  insert into public.sales (
    id,
    item_id,
    item_name,
    quantity,
    sale_price,
    cost_price,
    revenue,
    profit,
    note,
    sold_at
  ) values (
    gen_random_uuid(),
    p_item_id,
    v_item_name,
    p_qty,
    p_sale_price,
    v_cost_price,
    (p_sale_price * p_qty),
    ((p_sale_price - v_cost_price) * p_qty),
    p_note,
    p_sold_at
  );
end;
$$;

-- 2. 删除卖出记录并自动恢复库存的原子函数
create or replace function public.delete_sale_record(
  p_sale_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_item_id uuid;
  v_qty integer;
  v_item_exists boolean;
begin
  -- 2.1 获取并锁定销售记录
  select item_id, quantity
  into v_item_id, v_qty
  from public.sales
  where id = p_sale_id
  for update;

  if not found then
    raise exception '该销售记录已不存在。';
  end if;

  -- 2.2 校验关联商品是否还存在，存在则回退商品中的已售件数
  select exists(select 1 from public.items where id = v_item_id) into v_item_exists;
  if v_item_exists then
    update public.items
    set 
      sold_quantity = greatest(0, sold_quantity - v_qty),
      updated_at = now()
    where id = v_item_id;
  end if;

  -- 2.3 删除销售记录
  delete from public.sales where id = p_sale_id;
end;
$$;

-- 3. 授权公共执行权限
grant execute on function public.register_sale(uuid, integer, numeric, timestamptz, text) to anon, authenticated;
grant execute on function public.delete_sale_record(uuid) to anon, authenticated;

