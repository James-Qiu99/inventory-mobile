const SUPABASE_URL = window.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const INVENTORY_PAGE_SIZE = 15;
const SALES_PAGE_SIZE = 15;
const INVENTORY_TABLE = 'items';

const form = document.getElementById('itemForm');
const tableBody = document.getElementById('tableBody');
const mobileList = document.getElementById('mobileList');
const inventoryList = document.getElementById('inventoryList');
const stats = document.getElementById('stats');
const emptyState = document.getElementById('emptyState');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const saveAndNextBtn = document.getElementById('saveAndNextBtn');
const quickEntryMode = document.getElementById('quickEntryMode');
const extraFieldsBlock = document.getElementById('extraFieldsBlock');
const primaryFieldsBlock = document.getElementById('primaryFieldsBlock');
const searchInput = document.getElementById('searchInput');
const stockFilter = document.getElementById('stockFilter');
const sortFilter = document.getElementById('sortFilter');
const exportBtn = document.getElementById('exportBtn');
const backupBtn = document.getElementById('backupBtn');
const restoreBtn = document.getElementById('restoreBtn');
const restoreFile = document.getElementById('restoreFile');
const clearAllBtn = document.getElementById('clearAllBtn');
const syncStatus = document.getElementById('syncStatus');
const saleModal = document.getElementById('saleModal');
const saleForm = document.getElementById('saleForm');
const saleModalDesc = document.getElementById('saleModalDesc');
const saleCancelBtn = document.getElementById('saleCancelBtn');
const saleQuantityInput = document.getElementById('saleQuantity');
const salePriceInput = document.getElementById('salePrice');
const saleNoteInput = document.getElementById('saleNote');
const lowStockAlert = document.getElementById('lowStockAlert');
const periodStats = document.getElementById('periodStats');
const saleRecords = document.getElementById('saleRecords');
const workbenchGrid = document.getElementById('workbenchGrid');
const searchResultMeta = document.getElementById('searchResultMeta');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const emptyStateTitle = document.getElementById('emptyStateTitle');
const emptyStateText = document.getElementById('emptyStateText');
const pageInfo = document.getElementById('pageInfo');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const salesPageInfo = document.getElementById('salesPageInfo');
const prevSalesPageBtn = document.getElementById('prevSalesPageBtn');
const nextSalesPageBtn = document.getElementById('nextSalesPageBtn');
const quickActions = document.querySelector('.quick-actions');
const quickAddBtn = document.getElementById('quickAddBtn');
const quickListBtn = document.getElementById('quickListBtn');
const quickSalesBtn = document.getElementById('quickSalesBtn');
const quickTopBtn = document.getElementById('quickTopBtn');
const categoryChips = [...document.querySelectorAll('.category-chip')];
const qtyChips = [...document.querySelectorAll('.qty-chip')];
const entryReadyBanner = document.getElementById('entryReadyBanner');

function scrollToSection(id, offset = 0) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: 'smooth' });
}

function getStickySearchOffset(extra = 14) {
  const stickySearch = document.querySelector('.global-sticky-search');
  const stickyHeight = stickySearch?.getBoundingClientRect().height || 0;
  return stickyHeight + extra;
}

function scrollToAnchoredSection(id, extra = 14) {
  scrollToSection(id, getStickySearchOffset(extra));
}

function setQuickActionsVisibilityByInput(active) {
  if (!quickActions) return;
  quickActions.classList.toggle('hidden-by-input', !!active);
}

function isEditableTarget(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}


let items = [];
let saleLogs = [];
let editingId = null;
let saleItemId = null;
let loading = false;
let keepFormValuesForNext = false;
let inventoryPage = 1;
let inventoryTotalCount = 0;
let inventoryPageRows = [];
let inventorySummary = null;
let inventoryLowStock = [];
let inventoryRequestSeq = 0;
let inventoryReloadTimer = null;
let inventoryMode = 'server';
let salesPage = 1;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function money(n) {
  return '¥' + toNumber(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function percent(n) {
  return toNumber(n).toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeRegExp(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightKeyword(text, keyword) {
  const safeText = escapeHtml(text || '');
  const q = String(keyword || '').trim();
  if (!q) return safeText;
  const re = new RegExp(`(${escapeRegExp(q)})`, 'ig');
  return safeText.replace(re, '<mark style="background:#fef3c7;color:#92400e;padding:0 2px;border-radius:4px;">$1</mark>');
}


function calc(item) {
  const costPrice = toNumber(item.cost_price);
  const marketPrice = toNumber(item.market_price);
  const sellPrice = toNumber(item.sell_price);
  const quantity = Math.max(0, Math.floor(toNumber(item.quantity)));
  const soldQuantity = Math.max(0, Math.floor(toNumber(item.sold_quantity)));
  const safeSold = Math.min(quantity, soldQuantity);
  const remaining = Math.max(0, quantity - safeSold);
  const totalCost = costPrice * quantity;
  const realizedRevenue = sellPrice * safeSold;
  const realizedProfit = (sellPrice - costPrice) * safeSold;
  const potentialRevenue = sellPrice * remaining;
  const marketValue = marketPrice * remaining;
  const remainingCost = costPrice * remaining;
  const profitMargin = costPrice > 0 ? ((sellPrice - costPrice) / costPrice) * 100 : 0;
  return {
    costPrice, marketPrice, sellPrice, quantity,
    soldQuantity: safeSold,
    remaining, totalCost, realizedRevenue,
    realizedProfit, potentialRevenue, marketValue,
    remainingCost, profitMargin
  };
}

function setSyncStatus(message, warn = false) {
  syncStatus.classList.toggle('warn', warn);
  syncStatus.innerHTML = message;
}

function normalizeSearchTerm(value = '') {
  return String(value)
    .trim()
    .replace(/[(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getInventoryPageCount(totalCount = inventoryTotalCount) {
  return totalCount > 0 ? Math.max(1, Math.ceil(totalCount / INVENTORY_PAGE_SIZE)) : 0;
}

function getSalesPageCount(totalCount = saleLogs.length) {
  return totalCount > 0 ? Math.max(1, Math.ceil(totalCount / SALES_PAGE_SIZE)) : 0;
}

function buildFallbackInventorySummary(rows = inventoryPageRows) {
  const calcRows = rows.map((row) => calc(row));
  return {
    total_products: rows.length,
    total_units: calcRows.reduce((sum, row) => sum + row.quantity, 0),
    sold_units: calcRows.reduce((sum, row) => sum + row.soldQuantity, 0),
    remaining_units: calcRows.reduce((sum, row) => sum + row.remaining, 0),
    total_cost: calcRows.reduce((sum, row) => sum + row.totalCost, 0),
    realized_profit: calcRows.reduce((sum, row) => sum + row.realizedProfit, 0),
    estimated_total_profit: calcRows.reduce((sum, row) => sum + ((row.sellPrice - row.costPrice) * row.quantity), 0),
    remaining_market_value: calcRows.reduce((sum, row) => sum + row.marketValue, 0),
    remaining_sale_value: calcRows.reduce((sum, row) => sum + row.potentialRevenue, 0),
    low_stock_count: calcRows.filter((row) => row.remaining > 0 && row.remaining <= 3).length
  };
}

function getInventorySummary() {
  return inventorySummary || buildFallbackInventorySummary();
}

function getFilteredAndSortedItems(sourceItems = items) {
  const keyword = normalizeSearchTerm(searchInput.value).toLowerCase();
  const filter = stockFilter?.value || 'all';
  let list = sourceItems.filter((item) => {
    const c = calc(item);
    const searchable = [item.name, item.category, item.sku, item.supplier, item.location, item.note]
      .join(' ')
      .toLowerCase();
    const hitKeyword = !keyword || searchable.includes(keyword);
    let hitFilter = true;
    if (filter === 'inStock') hitFilter = c.remaining > 0;
    if (filter === 'soldOut') hitFilter = c.remaining === 0;
    if (filter === 'lowStock') hitFilter = c.remaining > 0 && c.remaining <= 3;
    return hitKeyword && hitFilter;
  });

  const mode = sortFilter?.value || 'updated_desc';
  list.sort((a, b) => {
    const ca = calc(a);
    const cb = calc(b);
    if (mode === 'stock_asc') return ca.remaining - cb.remaining;
    if (mode === 'profit_desc') return cb.realizedProfit - ca.realizedProfit;
    if (mode === 'price_desc') return cb.sellPrice - ca.sellPrice;
    return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
  });
  return list;
}

function getFallbackPageRows(sourceItems = items, page = inventoryPage) {
  const filtered = getFilteredAndSortedItems(sourceItems);
  const start = (Math.max(1, page) - 1) * INVENTORY_PAGE_SIZE;
  return filtered.slice(start, start + INVENTORY_PAGE_SIZE);
}

async function fetchSaleLogs() {
  const { data, error } = await supabaseClient.from('sales').select('*').order('sold_at', { ascending: false });
  if (error) throw error;
  saleLogs = data || [];
}

async function loadInventoryFallback(reason = 'query_failed') {
  const { data: itemsData, error: itemsError } = await supabaseClient
    .from('items')
    .select('*')
    .order('updated_at', { ascending: false });
  if (itemsError) {
    throw itemsError;
  }

  const allItems = itemsData || [];
  items = allItems;
  inventoryMode = 'fallback';
  inventorySummary = buildFallbackInventorySummary(allItems);
  inventoryLowStock = allItems
    .map((item) => ({ item, c: calc(item) }))
    .filter((x) => x.c.remaining > 0 && x.c.remaining <= 3)
    .sort((a, b) => a.c.remaining - b.c.remaining)
    .slice(0, 3)
    .map(({ item, c }) => ({ id: item.id, name: item.name, remaining: c.remaining }));
  inventoryTotalCount = getFilteredAndSortedItems(allItems).length;
  inventoryPageRows = getFallbackPageRows(allItems, inventoryPage);

  const { data: salesData, error: salesError } = await supabaseClient
    .from('sales')
    .select('*')
    .order('sold_at', { ascending: false });
  if (!salesError) {
    saleLogs = salesData || [];
  }

  render();
  const summary = getInventorySummary();
  const totalPages = getInventoryPageCount();
  setSyncStatus([
    `<strong>云端库存：</strong>${inventoryTotalCount} 条`,
    `<strong>剩余库存：</strong>${toNumber(summary.remaining_units)} 件`,
    `<strong>卖出记录：</strong>${saleLogs.length} 条`
  ].join('｜'), true);
  return reason;
}

function updatePaginationControls() {
  const totalPages = getInventoryPageCount();
  if (pageInfo) {
    pageInfo.textContent = totalPages
      ? `共 ${inventoryTotalCount} 条`
      : '暂无匹配库存';
  }
  if (prevPageBtn) prevPageBtn.disabled = loading || inventoryPage <= 1 || totalPages === 0;
  if (nextPageBtn) nextPageBtn.disabled = loading || inventoryPage >= totalPages || totalPages === 0;
}

function updateSalesPaginationControls() {
  const totalPages = getSalesPageCount();
  if (salesPageInfo) {
    salesPageInfo.textContent = totalPages
      ? `共 ${saleLogs.length} 条`
      : '暂无卖出记录';
  }
  if (prevSalesPageBtn) prevSalesPageBtn.disabled = loading || salesPage <= 1 || totalPages === 0;
  if (nextSalesPageBtn) nextSalesPageBtn.disabled = loading || salesPage >= totalPages || totalPages === 0;
}

function updateSearchClearButton() {
  if (!clearSearchBtn || !searchInput) return;
  clearSearchBtn.classList.toggle('show', !!searchInput.value.trim());
}

function renderSearchMeta() {
  if (!searchResultMeta) return;
  const keyword = normalizeSearchTerm(searchInput.value);
  if (!keyword) {
    searchResultMeta.style.display = 'none';
    searchResultMeta.textContent = '';
    return;
  }

  searchResultMeta.style.display = 'block';
  searchResultMeta.innerHTML = `🔎 关键词：<strong>${escapeHtml(keyword)}</strong> · 匹配 <strong>${inventoryTotalCount}</strong> 条`;
}

function renderWorkbench() {
  if (!workbenchGrid) return;
  const summary = getInventorySummary();
  const period = computePeriodStats();
  const totalRemaining = toNumber(summary.remaining_units);
  const lowCount = toNumber(summary.low_stock_count);
  const tiles = [
    ['🛍️', '今日卖出', period.dayQty, '', 'salesCard'],
    ['💰', '本月利润', money(period.monthProfit), '', 'salesStatsCard'],
    ['⚠️', '低库存', lowCount, '', 'lowStockAnchor'],
    ['📦', '剩余库存', totalRemaining, '', 'listSection']
  ];
  workbenchGrid.innerHTML = tiles.map(([icon, label, value, sub, target]) => `
    <button class="workbench-tile" type="button" data-target="${target}">
      <div class="k"><span class="icon-inline">${icon}</span>${label}</div>
      <div class="v">${value}</div>
      ${sub ? `<div class="s">${sub}</div>` : ''}
    </button>
  `).join('');
}

function renderLowStockAlert() {
  if (!lowStockAlert) return;
  if (!inventoryLowStock.length) {
    lowStockAlert.innerHTML = '<span class="tag">库存状态良好</span>';
    return;
  }
  lowStockAlert.innerHTML = `
    <div style="border:1px solid #fdba74;background:linear-gradient(180deg,#fff7ed,#fffbeb);border-radius:14px;padding:12px 14px;color:#9a3412;font-size:14px;box-shadow:0 8px 20px rgba(245,158,11,.10);">
      <strong>⚠️ 低库存提醒：</strong>${inventoryLowStock.map((x) => `${escapeHtml(x.name)}（剩 ${toNumber(x.remaining)}）`).join('、')}
    </div>`;
}

function renderStats() {
  const summary = getInventorySummary();
  const cards = [
    ['商品种类', toNumber(summary.total_products), `共录入 ${toNumber(summary.total_products)} 种商品`],
    ['进货总数量', toNumber(summary.total_units), `已售 ${toNumber(summary.sold_units)}，剩余 ${toNumber(summary.remaining_units)}`],
    ['总进货成本', money(summary.total_cost), '按全部库存统计'],
    ['已实现利润', money(summary.realized_profit), '已售数量对应的利润'],
    ['总利润（预计）', money(summary.estimated_total_profit), '按全部进货数量估算'],
    ['剩余库存按市场价', money(summary.remaining_market_value), '市场价 × 剩余库存'],
    ['剩余库存按售价', money(summary.remaining_sale_value), '售价 × 剩余库存']
  ];

  stats.innerHTML = cards.map(([label, value, hint]) => `
    <div class="stat">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      <div class="hint">${hint}</div>
    </div>
  `).join('');
}

async function loadInventoryPage({ page = inventoryPage, keepPage = true } = {}) {
  const requestId = ++inventoryRequestSeq;
  const targetPage = Math.max(1, page || 1);
  inventoryPage = targetPage;
  loading = true;
  setSyncStatus('<strong>同步中：</strong>正在加载库存和统计数据...');
  updatePaginationControls();

  try {
    const [{ data: itemsData, error: itemsError }, { data: salesData, error: salesError }] = await Promise.all([
      supabaseClient.from(INVENTORY_TABLE).select('*').order('updated_at', { ascending: false }),
      supabaseClient.from('sales').select('*').order('sold_at', { ascending: false })
    ]);

    if (requestId !== inventoryRequestSeq) return;
    if (itemsError) throw itemsError;
    if (salesError) console.warn(salesError);

    const allItems = itemsData || [];
    saleLogs = salesData || [];
    items = allItems;
    inventoryMode = 'direct';
    inventorySummary = buildFallbackInventorySummary(allItems);
    inventoryLowStock = allItems
      .map((item) => ({ item, c: calc(item) }))
      .filter((x) => x.c.remaining > 0 && x.c.remaining <= 3)
      .sort((a, b) => a.c.remaining - b.c.remaining)
      .slice(0, 3)
      .map(({ item, c }) => ({ id: item.id, name: item.name, remaining: c.remaining }));

    const filtered = getFilteredAndSortedItems(allItems);
    inventoryTotalCount = filtered.length;
    const totalPages = getInventoryPageCount();
    if (totalPages && inventoryPage > totalPages) {
      inventoryPage = totalPages;
    }
    const start = (Math.max(1, inventoryPage) - 1) * INVENTORY_PAGE_SIZE;
    inventoryPageRows = filtered.slice(start, start + INVENTORY_PAGE_SIZE);

    render();
    const summary = getInventorySummary();
    setSyncStatus([
      `<strong>云端库存：</strong>${inventoryTotalCount} 条`,
      `<strong>剩余库存：</strong>${toNumber(summary.remaining_units)} 件`,
      `<strong>卖出记录：</strong>${saleLogs.length} 条`
    ].join('｜'));
  } catch (error) {
    console.error(error);
    setSyncStatus(`<strong>加载失败：</strong>${escapeHtml(error?.message || '请检查 Supabase 配置')}`, true);
  } finally {
    if (requestId === inventoryRequestSeq) {
      loading = false;
      updatePaginationControls();
      updateSalesPaginationControls();
    }
  }
}

async function refreshInventory({ resetPage = false } = {}) {
  if (resetPage) inventoryPage = 1;
  await loadInventoryPage({ page: inventoryPage });
}

function getTodayMonthRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dStart = new Date(y, m, now.getDate(), 0,0,0,0).getTime();
  const dEnd = new Date(y, m, now.getDate(), 23,59,59,999).getTime();
  const mStart = new Date(y, m, 1, 0,0,0,0).getTime();
  const mEnd = new Date(y, m+1, 0, 23,59,59,999).getTime();
  return {dStart,dEnd,mStart,mEnd};
}

function computePeriodStats() {
  const {dStart,dEnd,mStart,mEnd} = getTodayMonthRange();
  const dayLogs = saleLogs.filter(x => { const t = new Date(x.sold_at).getTime(); return t>=dStart && t<=dEnd; });
  const monthLogs = saleLogs.filter(x => { const t = new Date(x.sold_at).getTime(); return t>=mStart && t<=mEnd; });
  const sum = (arr, key) => arr.reduce((a,b)=>a+toNumber(b[key]),0);
  return {
    dayQty: sum(dayLogs,'quantity'),
    dayRevenue: sum(dayLogs,'revenue'),
    dayProfit: sum(dayLogs,'profit'),
    monthQty: sum(monthLogs,'quantity'),
    monthRevenue: sum(monthLogs,'revenue'),
    monthProfit: sum(monthLogs,'profit')
  };
}

function renderPeriodStats() {
  const p = computePeriodStats();
  const cards = [
    ['今日卖出件数', p.dayQty, '按卖出记录统计'],
    ['今日销售额', money(p.dayRevenue), '成交单价 × 数量'],
    ['今日利润', money(p.dayProfit), '成交价 - 成本价'],
    ['本月卖出件数', p.monthQty, '自然月统计'],
    ['本月销售额', money(p.monthRevenue), '自然月累计'],
    ['本月利润', money(p.monthProfit), '自然月累计']
  ];
  periodStats.innerHTML = cards.map(([label, value, hint]) => `
    <div class="stat">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
      <div class="hint">${hint}</div>
    </div>
  `).join('');
}

function renderInventoryList() {
  const keyword = normalizeSearchTerm(searchInput.value);
  const list = inventoryPageRows;
  if (emptyState) {
    emptyState.style.display = list.length ? 'none' : 'block';
  }
  if (emptyStateTitle) {
    emptyStateTitle.textContent = inventoryTotalCount ? '当前页没有符合条件的商品' : '还没有商品数据';
  }
  if (emptyStateText) {
    emptyStateText.textContent = inventoryTotalCount
      ? '试试调整搜索词、库存状态筛选或翻到其他页。'
      : '先在上面录入一条试试。';
  }

  if (!inventoryList) return;
  if (!list.length) {
    inventoryList.innerHTML = '';
    updatePaginationControls();
    return;
  }

  inventoryList.innerHTML = list.map((item) => {
    const c = calc(item);
    const lowClass = c.remaining > 0 && c.remaining <= 3 ? 'low' : '';
    const noteHtml = item.note
      ? `<div class="inventory-note">备注：${highlightKeyword(item.note, keyword)}</div>`
      : '';
    return `
      <details class="inventory-item">
        <summary>
          <div class="inventory-head">
            <div class="inventory-name">${highlightKeyword(item.name, keyword)}</div>
            <div class="inventory-sub">${highlightKeyword(item.category || '未分类', keyword)} · ${highlightKeyword(item.sku || '无 SKU', keyword)}</div>
          </div>
          <div class="inventory-side">
            <div class="inventory-price">${money(c.sellPrice)}</div>
            <div class="inventory-sub">售价</div>
            <div class="inventory-remaining">${c.remaining} 件</div>
            <div class="inventory-sub">${c.remaining > 0 ? '可售库存' : '已售空'}</div>
          </div>
        </summary>
        <div class="inventory-body">
          <div class="inventory-banner ${lowClass}">
            <div>
              <div class="inventory-sub">库存状态</div>
              <div class="big">${c.soldQuantity} 已售 / ${c.remaining} 剩余</div>
            </div>
            <div>${stockTag(c.remaining)}</div>
          </div>
          <div class="inventory-grid">
            <div class="mini"><div class="k">SKU</div><div class="v">${escapeHtml(item.sku || '-')}</div></div>
            <div class="mini"><div class="k">进价</div><div class="v">${money(c.costPrice)}</div></div>
            <div class="mini"><div class="k">进货数量</div><div class="v">${c.quantity}</div></div>
            <div class="mini"><div class="k">供货渠道</div><div class="v">${highlightKeyword(item.supplier || '-', keyword)}</div></div>
            <div class="mini"><div class="k">总成本</div><div class="v">${money(c.totalCost)}</div></div>
            <div class="mini"><div class="k">已实现利润</div><div class="v ${c.realizedProfit >= 0 ? 'money pos' : 'money neg'}">${money(c.realizedProfit)}</div></div>
            <div class="mini"><div class="k">存放位置</div><div class="v">${highlightKeyword(item.location || '-', keyword)}</div></div>
          </div>
          ${noteHtml}
          <div class="actions">
            <button class="primary" onclick="sellItem('${item.id}')">登记卖出</button>
            <button class="secondary" onclick="editItem('${item.id}')">编辑</button>
            <button class="danger" onclick="deleteItem('${item.id}')">删除</button>
          </div>
        </div>
      </details>
    `;
  }).join('');

  updatePaginationControls();
}

function renderLegacyInventory() {
  if (!tableBody && !mobileList) return;
  const keyword = normalizeSearchTerm(searchInput.value);
  const list = inventoryPageRows;

  if (tableBody) {
    tableBody.innerHTML = list.map((item) => {
      const c = calc(item);
      return `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong><br>
            <span style="color:#6b7280; font-size:14px;">${escapeHtml(item.supplier || '-')} · ${escapeHtml(item.location || '-')}</span>
          </td>
          <td>${escapeHtml(item.category || '-')}</td>
          <td>${escapeHtml(item.sku || '-')}</td>
          <td>${money(c.costPrice)}</td>
          <td>${money(c.marketPrice)}</td>
          <td>${money(c.sellPrice)}</td>
          <td>${c.quantity}</td>
          <td>${c.soldQuantity}</td>
          <td>${c.remaining}<br>${stockTag(c.remaining)}</td>
          <td>${money(c.totalCost)}</td>
          <td class="money ${c.realizedProfit >= 0 ? 'pos' : 'neg'}">${money(c.realizedProfit)}</td>
          <td>${percent(c.profitMargin)}</td>
          <td>${escapeHtml(item.note || '-')}</td>
          <td>
            <div class="actions" style="margin-top:0;">
              <button class="primary" onclick="sellItem('${item.id}')">登记卖出</button>
              <button class="secondary" onclick="editItem('${item.id}')">编辑</button>
              <button class="danger" onclick="deleteItem('${item.id}')">删除</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (mobileList) {
    mobileList.innerHTML = list.map((item) => {
      const c = calc(item);
      const lowClass = c.remaining > 0 && c.remaining <= 3 ? 'low' : '';
      return `
        <div class="mobile-item">
          <div class="mobile-item-header">
            <div>
              <h3>${highlightKeyword(item.name, keyword)}</h3>
              <div class="mobile-item-sub">${highlightKeyword(item.category || '未分类', keyword)} · ${highlightKeyword(item.sku || '无 SKU', keyword)}</div>
            </div>
            <div style="text-align:right;">
              <div class="mobile-item-price">${money(c.sellPrice)}</div>
              <div class="mobile-item-sub">当前售价</div>
            </div>
          </div>
          <div class="mobile-stock-banner ${lowClass}">
            <div>
              <div class="mobile-item-sub">剩余库存</div>
              <div class="big">${c.remaining}</div>
            </div>
            <div>${stockTag(c.remaining)}</div>
          </div>
          <div class="mobile-meta">
            <div class="mini"><div class="k">分类</div><div class="v">${escapeHtml(item.category || '-')}</div></div>
            <div class="mini"><div class="k">SKU</div><div class="v">${escapeHtml(item.sku || '-')}</div></div>
            <div class="mini"><div class="k">进价</div><div class="v">${money(c.costPrice)}</div></div>
            <div class="mini"><div class="k">售价</div><div class="v">${money(c.sellPrice)}</div></div>
            <div class="mini"><div class="k">进货数量</div><div class="v">${c.quantity}</div></div>
            <div class="mini"><div class="k">已售 / 剩余</div><div class="v">${c.soldQuantity} / ${c.remaining}</div></div>
            <div class="mini"><div class="k">总成本</div><div class="v">${money(c.totalCost)}</div></div>
            <div class="mini"><div class="k">已实现利润</div><div class="v ${c.realizedProfit >= 0 ? 'money pos' : 'money neg'}">${money(c.realizedProfit)}</div></div>
          </div>
          <div style="font-size:14px; color:#6b7280; line-height:1.6; margin-bottom:10px;">
            供货渠道：${highlightKeyword(item.supplier || '-', keyword)}<br>
            存放位置：${highlightKeyword(item.location || '-', keyword)}<br>
            备注：${highlightKeyword(item.note || '-', keyword)}
          </div>
          <div class="actions">
            <button class="primary" onclick="sellItem('${item.id}')">登记卖出</button>
            <button class="secondary" onclick="editItem('${item.id}')">编辑</button>
            <button class="danger" onclick="deleteItem('${item.id}')">删除</button>
          </div>
        </div>
      `;
    }).join('');
  }
}

function render() {
  updateSearchClearButton();
  renderSearchMeta();
  renderWorkbench();
  renderStats();
  renderLowStockAlert();
  renderPeriodStats();
  renderSaleRecords();
  renderInventoryList();
  renderLegacyInventory();
}

function renderSaleRecords() {
  if (!saleLogs.length) {
    saleRecords.className = 'empty';
    saleRecords.textContent = '暂无卖出记录。';
    updateSalesPaginationControls();
    return;
  }
  const totalPages = getSalesPageCount();
  if (totalPages && salesPage > totalPages) {
    salesPage = totalPages;
  }
  const start = (Math.max(1, salesPage) - 1) * SALES_PAGE_SIZE;
  const rows = [...saleLogs]
    .sort((a,b)=>new Date(b.sold_at)-new Date(a.sold_at))
    .slice(start, start + SALES_PAGE_SIZE);
  saleRecords.className = '';
  saleRecords.innerHTML = `
    <div class="sale-mobile-list">
      ${rows.map((r) => `
        <div class="sale-mobile-item">
          <div class="sale-mobile-top">
            <div>
              <div class="sale-mobile-name">${escapeHtml(r.item_name || '-')}</div>
              <div class="sale-mobile-time">${escapeHtml(new Date(r.sold_at).toLocaleString('zh-CN'))}</div>
            </div>
            <div class="sale-mobile-profit ${toNumber(r.profit)>=0?'pos':'neg'}">${money(r.profit)}</div>
          </div>
          <div class="sale-mobile-meta">
            <span class="sale-mobile-chip"><strong>数量</strong>${r.quantity}</span>
            <span class="sale-mobile-chip"><strong>单价</strong>${money(r.sale_price)}</span>
            <span class="sale-mobile-chip"><strong>销售额</strong>${money(r.revenue)}</span>
            ${r.note ? `<span class="sale-mobile-chip"><strong>备注</strong>${escapeHtml(r.note)}</span>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    <div class="table-wrap">
      <table style="min-width:720px;">
        <thead>
          <tr><th>时间</th><th>商品</th><th>数量</th><th>成交单价</th><th>销售额</th><th>利润</th><th>备注</th></tr>
        </thead>
        <tbody>
          ${rows.map(r=>`<tr>
            <td>${escapeHtml(new Date(r.sold_at).toLocaleString('zh-CN'))}</td>
            <td>${escapeHtml(r.item_name || '-')}</td>
            <td>${r.quantity}</td>
            <td>${money(r.sale_price)}</td>
            <td>${money(r.revenue)}</td>
            <td class="money ${toNumber(r.profit)>=0?'pos':'neg'}">${money(r.profit)}</td>
            <td>${escapeHtml(r.note || '-')}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  updateSalesPaginationControls();
}

function openSaleModal(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  const c = calc(item);
  if (c.remaining <= 0) {
    alert('这个商品已经没有剩余库存了。');
    return;
  }
  saleItemId = id;
  saleModalDesc.textContent = `商品：${item.name}｜当前剩余库存：${c.remaining}｜默认售价：${money(c.sellPrice)}`;
  saleQuantityInput.value = '';
  salePriceInput.value = c.sellPrice || '';
  saleNoteInput.value = '';
  saleModal.classList.add('show');
  setTimeout(() => saleQuantityInput.focus(), 50);
}

function closeSaleModal() {
  saleItemId = null;
  saleForm.reset();
  saleModal.classList.remove('show');
}

function setActiveCategoryChip(value = '') {
  categoryChips.forEach((chip) => chip.classList.toggle('active', chip.dataset.category === value));
}

function flashEntryReadyBanner() {
  if (!entryReadyBanner) return;
  entryReadyBanner.style.display = 'block';
  clearTimeout(flashEntryReadyBanner._timer);
  flashEntryReadyBanner._timer = setTimeout(() => {
    entryReadyBanner.style.display = 'none';
  }, 1600);
}

function flashNameField() {
  const nameField = document.getElementById('name')?.closest('.field');
  if (!nameField) return;
  nameField.classList.add('field-highlight');
  clearTimeout(flashNameField._timer);
  flashNameField._timer = setTimeout(() => {
    nameField.classList.remove('field-highlight');
  }, 1800);
}

function applyQuickEntryMode() {
  if (!quickEntryMode || !extraFieldsBlock) return;

  if (quickEntryMode.checked) {
    extraFieldsBlock.removeAttribute('open');
    if (saveAndNextBtn) saveAndNextBtn.style.display = '';
    if (submitBtn) submitBtn.textContent = editingId ? '更新商品' : '保存商品';
  } else {
    extraFieldsBlock.setAttribute('open', 'open');
    if (saveAndNextBtn) saveAndNextBtn.style.display = 'none';
    if (submitBtn) submitBtn.textContent = editingId ? '更新商品' : '保存全部信息';
  }
}

function resetForm() {
  const previousCategory = document.getElementById('category').value;
  const previousLocation = document.getElementById('location').value;
  const previousSupplier = document.getElementById('supplier').value;
  form.reset();
  editingId = null;
  formTitle.textContent = '新增商品';
  submitBtn.textContent = '保存商品';

  if (keepFormValuesForNext) {
    document.getElementById('category').value = previousCategory || '';
    document.getElementById('location').value = previousLocation || '';
    document.getElementById('supplier').value = previousSupplier || '';
    setActiveCategoryChip(previousCategory || '');
    keepFormValuesForNext = false;
    setTimeout(() => {
      if (primaryFieldsBlock) primaryFieldsBlock.setAttribute('open', 'open');
      scrollToSection('formSection');
      flashEntryReadyBanner();
      flashNameField();
      const nameInput = document.getElementById('name');
      if (nameInput) {
        nameInput.focus();
        nameInput.click?.();
        nameInput.select?.();
      }
      setTimeout(() => {
        nameInput?.focus();
        nameInput?.click?.();
      }, 120);
    }, 180);
  } else {
    setActiveCategoryChip('');
  }

  applyQuickEntryMode();
}

function getFormData() {
  return {
    id: editingId || crypto.randomUUID(),
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value.trim(),
    sku: document.getElementById('sku').value.trim(),
    supplier: document.getElementById('supplier').value.trim(),
    cost_price: toNumber(document.getElementById('costPrice').value),
    market_price: toNumber(document.getElementById('marketPrice').value),
    sell_price: toNumber(document.getElementById('sellPrice').value),
    quantity: Math.max(0, Math.floor(toNumber(document.getElementById('quantity').value))),
    sold_quantity: Math.max(0, Math.floor(toNumber(document.getElementById('soldQuantity').value))),
    location: document.getElementById('location').value.trim(),
    note: document.getElementById('note').value.trim(),
    updated_at: new Date().toISOString()
  };
}

function buildMergedItemPayload(existingItem, incomingItem) {
  const mergedNote = [existingItem.note, incomingItem.note]
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .join('\n');

  return {
    ...existingItem,
    name: existingItem.name || incomingItem.name,
    category: existingItem.category || incomingItem.category,
    sku: existingItem.sku || incomingItem.sku,
    supplier: existingItem.supplier || incomingItem.supplier,
    cost_price: toNumber(existingItem.cost_price || incomingItem.cost_price),
    market_price: toNumber(existingItem.market_price || incomingItem.market_price),
    sell_price: toNumber(existingItem.sell_price || incomingItem.sell_price),
    quantity: Math.max(0, Math.floor(toNumber(existingItem.quantity) + toNumber(incomingItem.quantity))),
    sold_quantity: Math.max(0, Math.floor(toNumber(existingItem.sold_quantity) + toNumber(incomingItem.sold_quantity))),
    location: existingItem.location || incomingItem.location,
    note: mergedNote,
    updated_at: new Date().toISOString()
  };
}

async function findMergeCandidate(data) {
  const { data: matches, error } = await supabaseClient
    .from('items')
    .select('*')
    .eq('name', data.name)
    .eq('cost_price', data.cost_price)
    .limit(10);

  if (error) throw error;
  if (!matches?.length) return null;

  const normalizedSku = String(data.sku || '').trim();
  if (normalizedSku) {
    return matches.find((item) => String(item.sku || '').trim() === normalizedSku) || matches[0];
  }
  return matches[0];
}

function fillForm(item) {
  editingId = item.id;
  formTitle.textContent = '编辑商品';
  submitBtn.textContent = '更新商品';
  document.getElementById('name').value = item.name || '';
  document.getElementById('category').value = item.category || '';
  setActiveCategoryChip(item.category || '');
  document.getElementById('sku').value = item.sku || '';
  document.getElementById('supplier').value = item.supplier || '';
  document.getElementById('costPrice').value = item.cost_price ?? '';
  document.getElementById('marketPrice').value = item.market_price ?? '';
  document.getElementById('sellPrice').value = item.sell_price ?? '';
  document.getElementById('quantity').value = item.quantity ?? '';
  document.getElementById('soldQuantity').value = item.sold_quantity ?? '';
  document.getElementById('location').value = item.location || '';
  document.getElementById('note').value = item.note || '';

  if (primaryFieldsBlock) primaryFieldsBlock.setAttribute('open', 'open');
  scrollToSection('formSection');
  setTimeout(() => {
    const nameInput = document.getElementById('name');
    nameInput?.focus();
    nameInput?.select?.();
  }, 180);
}

async function removeItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`确定删除商品「${item.name}」吗？`)) return;

  const { error: salesError } = await supabaseClient.from('sales').delete().eq('item_id', id);
  if (salesError) {
    alert('删除卖出记录失败：' + salesError.message);
    return;
  }
  const { error } = await supabaseClient.from('items').delete().eq('id', id);
  if (error) {
    alert('删除商品失败：' + error.message);
    return;
  }
  if (editingId === id) resetForm();
  await applyQuickEntryMode();
  await refreshInventory();
}
function stockTag(remaining) {
  if (remaining === 0) return '<span class="tag gray">已售空</span>';
  if (remaining <= 3) return '<span class="tag warn">低库存</span>';
  return '<span class="tag">有库存</span>';
}

function getAllInventoryRowsForExport() {
  const chunkSize = 1000;
  return (async () => {
    const rows = [];
    let offset = 0;
    while (true) {
      const { data, error } = await supabaseClient
        .from(INVENTORY_TABLE)
        .select('*')
        .order('updated_at', { ascending: false })
        .range(offset, offset + chunkSize - 1);
      if (error) throw error;
      const batch = data || [];
      rows.push(...batch);
      if (batch.length < chunkSize) break;
      offset += chunkSize;
    }
    return rows;
  })();
}

function exportCSV() {
  return getAllInventoryRowsForExport().then((allItems) => {
    if (!allItems.length) {
      alert('当前没有数据可导出。');
      return;
    }
    const rows = [[
      '商品名称','分类','SKU','供货渠道','进价','市场价','售价','进货数量','已售数量','剩余库存','总成本','已实现利润','利润率','存放位置','备注','更新时间'
    ]];
    allItems.forEach(item => {
      const c = calc(item);
      rows.push([
        item.name, item.category, item.sku, item.supplier,
        c.costPrice, c.marketPrice, c.sellPrice,
        c.quantity, c.soldQuantity, c.remaining,
        c.totalCost, c.realizedProfit, c.profitMargin,
        item.location, item.note, item.updated_at || ''
      ]);
    });
    const csv = '\uFEFF' + rows.map(row => row.map(value => {
      const s = String(value ?? '');
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '库存数据导出.csv';
    a.click();
    URL.revokeObjectURL(url);
  }).catch((error) => {
    alert('导出失败：' + (error?.message || '请检查 Supabase 配置'));
  });
}

function formatBackupFileName(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `库存备份-${y}${m}${d}-${hh}${mm}${ss}.json`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = getFormData();
  if (!data.name) {
    alert('请填写商品名称。');
    return;
  }
  if (data.sold_quantity > data.quantity) {
    alert('已售数量不能大于进货数量。');
    return;
  }

  let error = null;

  if (editingId) {
    ({ error } = await supabaseClient.from('items').update(data).eq('id', data.id));
  } else {
    const mergeCandidate = await findMergeCandidate(data);
    if (mergeCandidate) {
      const shouldMerge = confirm(`已存在同名且进价相同的商品「${mergeCandidate.name}」。\n要把这次录入的数量合并到原商品里吗？`);
      if (shouldMerge) {
        const mergedData = buildMergedItemPayload(mergeCandidate, data);
        ({ error } = await supabaseClient.from('items').update(mergedData).eq('id', mergeCandidate.id));
      } else {
        ({ error } = await supabaseClient.from('items').insert(data));
      }
    } else {
      ({ error } = await supabaseClient.from('items').insert(data));
    }
  }

  if (error) {
    alert((editingId ? '更新' : '保存') + '失败：' + error.message);
    return;
  }
  await applyQuickEntryMode();
  await refreshInventory({ resetPage: !editingId });
  resetForm();
});

resetBtn.addEventListener('click', () => { keepFormValuesForNext = false; resetForm(); });
if (saveAndNextBtn) saveAndNextBtn.addEventListener('click', () => { keepFormValuesForNext = true; form.requestSubmit(); });
if (quickEntryMode) quickEntryMode.addEventListener('change', applyQuickEntryMode);
searchInput.addEventListener('input', () => {
  updateSearchClearButton();
  clearTimeout(inventoryReloadTimer);
  inventoryReloadTimer = setTimeout(() => {
    refreshInventory({ resetPage: true });
  }, 220);
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    clearTimeout(inventoryReloadTimer);
    refreshInventory({ resetPage: true });
    scrollToAnchoredSection('listSection');
    searchInput.blur();
  }
});

stockFilter.addEventListener('change', () => refreshInventory({ resetPage: true }));
if (clearSearchBtn) clearSearchBtn.addEventListener('click', () => { searchInput.value = ''; updateSearchClearButton(); refreshInventory({ resetPage: true }); searchInput.focus(); });
if (sortFilter) sortFilter.addEventListener('change', () => refreshInventory({ resetPage: true }));
if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
  if (inventoryPage <= 1) return;
  inventoryPage -= 1;
  refreshInventory();
  scrollToAnchoredSection('listSection');
});
if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
  const totalPages = getInventoryPageCount();
  if (totalPages && inventoryPage >= totalPages) return;
  inventoryPage += 1;
  refreshInventory();
  scrollToAnchoredSection('listSection');
});
if (prevSalesPageBtn) prevSalesPageBtn.addEventListener('click', () => {
  if (salesPage <= 1) return;
  salesPage -= 1;
  renderSaleRecords();
  scrollToAnchoredSection('salesCard');
});
if (nextSalesPageBtn) nextSalesPageBtn.addEventListener('click', () => {
  const totalPages = getSalesPageCount();
  if (totalPages && salesPage >= totalPages) return;
  salesPage += 1;
  renderSaleRecords();
  scrollToAnchoredSection('salesCard');
});
exportBtn.addEventListener('click', exportCSV);

backupBtn.addEventListener('click', async () => {
  try {
    const exportedAt = new Date().toISOString();
    const allItems = await getAllInventoryRowsForExport();
    const payload = { version: 3, exportedAt, source: 'supabase', items: allItems, saleLogs };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = formatBackupFileName();
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert('备份失败：' + (error?.message || '请检查 Supabase 配置'));
  }
});

restoreBtn.addEventListener('click', () => restoreFile.click());
restoreFile.addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data.items)) throw new Error('备份格式无效：缺少 items');
    const importedSales = Array.isArray(data.saleLogs) ? data.saleLogs : [];
    const exportedAtText = data.exportedAt
      ? new Date(data.exportedAt).toLocaleString('zh-CN')
      : '未知时间';
    const previewMessage = [
      '即将把备份恢复到云端数据库：',
      `- 商品数量：${data.items.length} 条`,
      `- 卖出记录：${importedSales.length} 条`,
      `- 备份时间：${exportedAtText}`,
      '',
      '注意：这会先清空 Supabase 里的当前数据，再导入备份。',
      '确定继续恢复吗？'
    ].join('\n');
    if (!confirm(previewMessage)) return;

    const { error: delSalesError } = await supabaseClient.from('sales').delete().gte('sold_at', '1900-01-01T00:00:00Z');
    if (delSalesError) throw delSalesError;
    const { error: delItemsError } = await supabaseClient.from('items').delete().gte('updated_at', '1900-01-01T00:00:00Z');
    if (delItemsError) throw delItemsError;

    if (data.items.length) {
      const { error: insertItemsError } = await supabaseClient.from('items').insert(data.items);
      if (insertItemsError) throw insertItemsError;
    }
    if (importedSales.length) {
      const normalizedSales = importedSales.map((sale) => ({
        ...sale,
        sold_at: sale.sold_at || sale.soldAt || new Date().toISOString(),
        sale_price: sale.sale_price ?? sale.salePrice ?? 0,
        cost_price: sale.cost_price ?? sale.costPrice ?? 0,
        item_name: sale.item_name ?? sale.itemName ?? ''
      }));
      const { error: insertSalesError } = await supabaseClient.from('sales').insert(normalizedSales);
      if (insertSalesError) throw insertSalesError;
    }

    await applyQuickEntryMode();
    await refreshInventory({ resetPage: true });
    resetForm();
    alert(`恢复成功：已导入 ${data.items.length} 条商品，${importedSales.length} 条卖出记录。`);
  } catch (err) {
    alert('恢复失败：' + (err?.message || '文件格式错误'));
  } finally {
    restoreFile.value = '';
  }
});

saleCancelBtn.addEventListener('click', closeSaleModal);
saleModal.addEventListener('click', (e) => {
  if (e.target === saleModal) closeSaleModal();
});
saleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const item = items.find(i => i.id === saleItemId);
  if (!item) return closeSaleModal();
  const c = calc(item);
  const saleQty = Math.max(1, Math.floor(toNumber(saleQuantityInput.value)));
  const salePrice = toNumber(salePriceInput.value || item.sell_price);
  const saleNote = saleNoteInput.value.trim();
  if (saleQty > c.remaining) {
    alert(`卖出数量不能大于剩余库存（当前剩余 ${c.remaining}）。`);
    return;
  }

  const nextSoldQuantity = toNumber(item.sold_quantity) + saleQty;
  const updatedItem = {
    sold_quantity: nextSoldQuantity,
    sell_price: salePrice,
    updated_at: new Date().toISOString(),
    note: saleNote ? `${item.note ? item.note + '\n' : ''}[卖出 ${saleQty} 件 @ ${salePrice}] ${saleNote}` : item.note
  };

  const { error: itemError } = await supabaseClient.from('items').update(updatedItem).eq('id', item.id);
  if (itemError) {
    alert('更新库存失败：' + itemError.message);
    return;
  }

  const saleRecord = {
    id: crypto.randomUUID(),
    item_id: item.id,
    item_name: item.name,
    quantity: saleQty,
    sale_price: salePrice,
    cost_price: toNumber(item.cost_price),
    revenue: salePrice * saleQty,
    profit: (salePrice - toNumber(item.cost_price)) * saleQty,
    note: saleNote,
    sold_at: new Date().toISOString()
  };

  const { error: saleError } = await supabaseClient.from('sales').insert(saleRecord);
  if (saleError) {
    alert('保存卖出记录失败：' + saleError.message);
    return;
  }

  await applyQuickEntryMode();
  await refreshInventory();
  closeSaleModal();
});

clearAllBtn.addEventListener('click', async () => {
  if (!confirm('确定清空云端全部商品和卖出记录吗？此操作会删除 Supabase 里的库存数据。')) return;
  const { error: delSalesError } = await supabaseClient.from('sales').delete().gte('sold_at', '1900-01-01T00:00:00Z');
  if (delSalesError) return alert('清空卖出记录失败：' + delSalesError.message);
  const { error: delItemsError } = await supabaseClient.from('items').delete().gte('updated_at', '1900-01-01T00:00:00Z');
  if (delItemsError) return alert('清空商品失败：' + delItemsError.message);
  await applyQuickEntryMode();
  await refreshInventory({ resetPage: true });
  resetForm();
});

window.editItem = function(id) {
  const item = items.find(i => i.id === id);
  if (item) fillForm(item);
}

window.deleteItem = function(id) {
  removeItem(id);
}

window.sellItem = function(id) {
  openSaleModal(id);
}

categoryChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const categoryInput = document.getElementById('category');
    categoryInput.value = chip.dataset.category || '';
    setActiveCategoryChip(chip.dataset.category || '');
  });
});

qtyChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    saleQuantityInput.value = chip.dataset.qty || '1';
  });
});

if (quickAddBtn) quickAddBtn.addEventListener('click', () => scrollToSection('formSection'));
if (quickListBtn) quickListBtn.addEventListener('click', () => scrollToAnchoredSection('listSection'));
if (quickSalesBtn) quickSalesBtn.addEventListener('click', () => scrollToAnchoredSection('salesCard'));
if (quickTopBtn) quickTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
if (workbenchGrid) workbenchGrid.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-target]');
  if (!trigger) return;
  scrollToAnchoredSection(trigger.dataset.target);
});

applyQuickEntryMode();
updateSearchClearButton();
refreshInventory({ resetPage: true });

document.addEventListener('focusin', (e) => {
  if (isEditableTarget(e.target)) setQuickActionsVisibilityByInput(true);
});

document.addEventListener('focusout', () => {
  setTimeout(() => {
    const active = document.activeElement;
    setQuickActionsVisibilityByInput(isEditableTarget(active));
  }, 80);
});

window.addEventListener('resize', () => {
  const active = document.activeElement;
  setQuickActionsVisibilityByInput(isEditableTarget(active));
});
