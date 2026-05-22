const SUPABASE_URL = window.SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const INVENTORY_PAGE_SIZE = 15;
const SALES_PAGE_SIZE = 15;
const INVENTORY_TABLE = 'items';

const form = document.getElementById('itemForm');
const tableBody = document.getElementById('tableBody');
const inventoryList = document.getElementById('inventoryList');
const emptyState = document.getElementById('emptyState');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const saveAndNextBtn = document.getElementById('saveAndNextBtn');
const quickEntryMode = document.getElementById('quickEntryMode');
const extraFieldsPane = document.getElementById('extraFieldsPane');
const primaryFieldsPane = document.getElementById('primaryFieldsPane');
const floatingTabBar = document.getElementById('floatingTabBar');
const searchInput = document.getElementById('searchInput');
const stockFilter = document.getElementById('stockFilter');
const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const exportBtn = document.getElementById('exportBtn');
const backupBtn = document.getElementById('backupBtn');
const restoreBtn = document.getElementById('restoreBtn');
const restoreFile = document.getElementById('restoreFile');
const syncStatus = document.getElementById('syncStatus');
const saleModal = document.getElementById('saleModal');
const saleForm = document.getElementById('saleForm');
const saleModalDesc = document.getElementById('saleModalDesc');
const saleCancelBtn = document.getElementById('saleCancelBtn');
const saleSubmitBtn = document.getElementById('saleSubmitBtn');
const saleQuantityInput = document.getElementById('saleQuantity');
const salePriceInput = document.getElementById('salePrice');
const saleTimeInput = document.getElementById('saleTime');
const saleNoteInput = document.getElementById('saleNote');
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editModalDesc = document.getElementById('editModalDesc');
const editCancelBtn = document.getElementById('editCancelBtn');
const editSubmitBtn = document.getElementById('editSubmitBtn');
const editNameInput = document.getElementById('editName');
const editCategoryInput = document.getElementById('editCategory');
const editSkuInput = document.getElementById('editSku');
const editSupplierInput = document.getElementById('editSupplier');
const editCostPriceInput = document.getElementById('editCostPrice');
const editMarketPriceInput = document.getElementById('editMarketPrice');
const editQuantityInput = document.getElementById('editQuantity');
const editLocationInput = document.getElementById('editLocation');
const editNoteInput = document.getElementById('editNote');
const saleTimeEditModal = document.getElementById('saleTimeEditModal');
const saleTimeEditForm = document.getElementById('saleTimeEditForm');
const saleTimeEditDesc = document.getElementById('saleTimeEditDesc');
const saleTimeEditInput = document.getElementById('saleTimeEditInput');
const saleTimeEditCancelBtn = document.getElementById('saleTimeEditCancelBtn');
const saleTimeEditSubmitBtn = document.getElementById('saleTimeEditSubmitBtn');
const saleRecords = document.getElementById('saleRecords');
const workbenchGrid = document.getElementById('workbenchGrid');
const searchResultMeta = document.getElementById('searchResultMeta');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const emptyStateTitle = document.getElementById('emptyStateTitle');
const emptyStateText = document.getElementById('emptyStateText');
const pageInfo = document.getElementById('pageInfo');
const pageNumbers = document.getElementById('pageNumbers');
const firstPageBtn = document.getElementById('firstPageBtn');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const lastPageBtn = document.getElementById('lastPageBtn');
const salesPageInfo = document.getElementById('salesPageInfo');
const salesCategoryFilter = document.getElementById('salesCategoryFilter');
const salesPageNumbers = document.getElementById('salesPageNumbers');
const firstSalesPageBtn = document.getElementById('firstSalesPageBtn');
const prevSalesPageBtn = document.getElementById('prevSalesPageBtn');
const nextSalesPageBtn = document.getElementById('nextSalesPageBtn');
const lastSalesPageBtn = document.getElementById('lastSalesPageBtn');
const quickCategoryRow = document.getElementById('quickCategoryRow');
const profitMonthSelect = document.getElementById('profitMonthSelect');
const toastHost = document.getElementById('toastHost');
const toastMessage = document.getElementById('toastMessage');
const DEFAULT_QUICK_CATEGORIES = ['Jellycat', '泡泡玛特', '化妆品', '服饰', '其他'];

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
  if (!floatingTabBar) return;
  const isInputFocused = active !== undefined ? !!active : isEditableTarget(document.activeElement);
  const isAnyModalOpen = document.body.classList.contains('modal-open') || 
                         !!document.querySelector('.modal-backdrop.show');
  floatingTabBar.classList.toggle('hidden-by-input', isInputFocused || isAnyModalOpen);
}

function showToast(message) {
  if (!toastHost || !toastMessage) return;
  toastMessage.textContent = message;
  toastHost.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toastHost.classList.remove('show');
  }, 2200);
}

function isEditableTarget(el) {
  if (!el) return false;
  const tag = el.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

function shouldAutoFocusSaleInput() {
  return !window.matchMedia('(max-width: 900px)').matches;
}

let lockedScrollY = 0;

function lockPageScroll() {
  if (document.body.classList.contains('modal-open')) return;
  lockedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
  document.body.classList.add('modal-open');
  document.body.style.position = 'fixed';
  document.body.style.top = `-${lockedScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  setQuickActionsVisibilityByInput();
}

function unlockPageScroll() {
  if (!document.body.classList.contains('modal-open')) return;
  document.body.classList.remove('modal-open');
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.left = '';
  document.body.style.right = '';
  document.body.style.width = '';
  window.scrollTo(0, lockedScrollY);
  setQuickActionsVisibilityByInput();
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
let selectedProfitMonth = getMonthKey(new Date());
let currentPeriod = 'today';
let saleSubmitting = false;
let editSubmitting = false;
let editingSaleTimeId = null;
let saleTimeEditSubmitting = false;

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function money(n) {
  return '¥' + toNumber(n).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function moneyShort(n) {
  return '¥' + toNumber(n).toLocaleString('zh-CN', { maximumFractionDigits: 0 });
}

function moneyOrPending(value, label = '待补') {
  return toNumber(value) > 0 ? money(value) : `<span class="pending-text">${label}</span>`;
}

function percent(n) {
  return toNumber(n).toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

function getMonthKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return getMonthKey(new Date());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey || '').split('-');
  if (!year || !month) return '未知月份';
  return `${year}年${Number(month)}月`;
}

function getMonthRange(monthKey = selectedProfitMonth) {
  const [year, month] = String(monthKey || getMonthKey()).split('-').map(Number);
  const y = Number.isFinite(year) ? year : new Date().getFullYear();
  const m = Number.isFinite(month) ? month - 1 : new Date().getMonth();
  return {
    start: new Date(y, m, 1, 0, 0, 0, 0).getTime(),
    end: new Date(y, m + 1, 0, 23, 59, 59, 999).getTime()
  };
}

function toDatetimeLocalValue(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
  const offsetMs = safeDate.getTimezoneOffset() * 60000;
  return new Date(safeDate.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getSaleTimeIso() {
  if (!saleTimeInput?.value) return new Date().toISOString();
  const d = new Date(saleTimeInput.value);
  if (Number.isNaN(d.getTime())) {
    alert('请选择有效的卖出时间。');
    return null;
  }
  return d.toISOString();
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
  return safeText.replace(re, '<mark class="search-hit">$1</mark>');
}


function calc(item) {
  const costPrice = toNumber(item.cost_price);
  const marketPrice = toNumber(item.market_price);
  const estimatedPrice = marketPrice || toNumber(item.sell_price);
  const quantity = Math.max(0, Math.floor(toNumber(item.quantity)));
  const soldQuantity = Math.max(0, Math.floor(toNumber(item.sold_quantity)));
  const safeSold = Math.min(quantity, soldQuantity);
  const remaining = Math.max(0, quantity - safeSold);
  const itemSales = saleLogs.filter((sale) => sale.item_id === item.id);
  const soldFromRecords = itemSales.reduce((sum, sale) => sum + Math.max(0, Math.floor(toNumber(sale.quantity))), 0);
  const totalCost = costPrice * quantity;
  const realizedRevenue = itemSales.reduce((sum, sale) => sum + toNumber(sale.revenue), 0);
  const realizedProfit = itemSales.reduce((sum, sale) => sum + toNumber(sale.profit), 0);
  const potentialRevenue = estimatedPrice * remaining;
  const potentialProfit = (estimatedPrice - costPrice) * remaining;
  const marketValue = estimatedPrice * remaining;
  const remainingCost = costPrice * remaining;
  const profitMargin = costPrice > 0 ? ((estimatedPrice - costPrice) / costPrice) * 100 : 0;
  return {
    costPrice, marketPrice, sellPrice: estimatedPrice, estimatedPrice, quantity,
    soldQuantity: safeSold,
    soldFromRecords,
    remaining, totalCost, realizedRevenue,
    realizedProfit, potentialRevenue, potentialProfit, marketValue,
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

function getSalesPageCount(totalCount = getFilteredSaleLogs().length) {
  return totalCount > 0 ? Math.max(1, Math.ceil(totalCount / SALES_PAGE_SIZE)) : 0;
}

function getRegisteredCategories() {
  return [...new Set(items.map((item) => String(item.category || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function getQuickCategories(extraLimit = 3) {
  const counts = new Map();
  items.forEach((item) => {
    const category = String(item.category || '').trim();
    if (!category) return;
    counts.set(category, (counts.get(category) || 0) + 1);
  });

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'))
    .map(([category]) => category);
  const extraCategories = ranked
    .filter((category) => !DEFAULT_QUICK_CATEGORIES.includes(category))
    .slice(0, extraLimit);
  return [...extraCategories, ...DEFAULT_QUICK_CATEGORIES];
}

function renderQuickCategoryChips() {
  if (!quickCategoryRow) return;
  const selected = document.getElementById('category')?.value.trim() || '';
  quickCategoryRow.innerHTML = getQuickCategories().map((category) => {
    const active = category === selected ? ' active' : '';
    return `<button type="button" class="category-chip${active}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`;
  }).join('');
}

function renderCategoryFilterOptions() {
  const categories = getRegisteredCategories();
  const renderOptions = (selectedValue = '') => [
    '<option value="">全部分类</option>',
    ...categories.map((category) => (
      `<option value="${escapeHtml(category)}" ${category === selectedValue ? 'selected' : ''}>${escapeHtml(category)}</option>`
    ))
  ].join('');

  if (categoryFilter) {
    const selected = categories.includes(categoryFilter.value) ? categoryFilter.value : '';
    categoryFilter.innerHTML = renderOptions(selected);
  }
  if (salesCategoryFilter) {
    const selected = categories.includes(salesCategoryFilter.value) ? salesCategoryFilter.value : '';
    salesCategoryFilter.innerHTML = renderOptions(selected);
  }
}

function getSaleCategory(sale) {
  const item = items.find((row) => row.id === sale.item_id);
  return String(item?.category || '').trim();
}

function getFilteredSaleLogs() {
  const categories = getRegisteredCategories();
  const selectedCategory = salesCategoryFilter?.value || '';
  const category = categories.includes(selectedCategory) ? selectedCategory : '';
  return saleLogs.filter((sale) => !category || getSaleCategory(sale) === category);
}

function getCompactPageList(currentPage, totalPages) {
  if (totalPages <= 0) return [];
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  if (currentPage <= 4) {
    [2, 3, 4, 5].forEach((page) => pages.add(page));
  }
  if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
  }

  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const result = [];
  sorted.forEach((page) => {
    const previous = result[result.length - 1];
    if (typeof previous === 'number' && page - previous > 1) result.push('...');
    result.push(page);
  });
  return result;
}

function renderPageNumbers(container, currentPage, totalPages, target) {
  if (!container) return;
  if (!totalPages) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = getCompactPageList(currentPage, totalPages).map((page) => {
    if (page === '...') return '<span class="page-ellipsis">...</span>';
    const active = page === currentPage ? ' active' : '';
    return `<button type="button" class="page-number${active}" data-page-target="${target}" data-page="${page}" aria-label="第 ${page} 页">${page}</button>`;
  }).join('');
}

function buildFallbackInventorySummary(rows = inventoryPageRows) {
  const calcRows = rows.map((row) => calc(row));
  const realizedProfit = saleLogs.reduce((sum, sale) => sum + toNumber(sale.profit), 0);
  const realizedRevenue = saleLogs.reduce((sum, sale) => sum + toNumber(sale.revenue), 0);
  return {
    total_products: rows.length,
    total_units: calcRows.reduce((sum, row) => sum + row.quantity, 0),
    sold_units: calcRows.reduce((sum, row) => sum + row.soldQuantity, 0),
    remaining_units: calcRows.reduce((sum, row) => sum + row.remaining, 0),
    total_cost: calcRows.reduce((sum, row) => sum + row.totalCost, 0),
    realized_revenue: realizedRevenue,
    realized_profit: realizedProfit,
    estimated_total_profit: calcRows.reduce((sum, row) => sum + ((row.estimatedPrice - row.costPrice) * row.quantity), 0),
    remaining_potential_profit: calcRows.reduce((sum, row) => sum + row.potentialProfit, 0),
    remaining_market_value: calcRows.reduce((sum, row) => sum + row.marketValue, 0),
    remaining_sale_value: calcRows.reduce((sum, row) => sum + row.potentialRevenue, 0),
    remaining_cost: calcRows.reduce((sum, row) => sum + row.remainingCost, 0),
    low_stock_count: calcRows.filter((row) => row.remaining > 0 && row.remaining <= 3).length
  };
}

function getInventorySummary() {
  return inventorySummary || buildFallbackInventorySummary();
}

function getFilteredAndSortedItems(sourceItems = items) {
  const keyword = normalizeSearchTerm(searchInput.value).toLowerCase();
  const filter = stockFilter?.value || 'active';
  const selectedCategory = categoryFilter?.value || '';
  const sourceCategories = new Set(sourceItems.map((item) => String(item.category || '').trim()).filter(Boolean));
  const category = sourceCategories.has(selectedCategory) ? selectedCategory : '';
  let list = sourceItems.filter((item) => {
    const c = calc(item);
    const searchable = [item.name, item.category, item.sku, item.supplier, item.location, item.note]
      .join(' ')
      .toLowerCase();
    const hitKeyword = !keyword || searchable.includes(keyword);
    const hitCategory = !category || String(item.category || '').trim() === category;
    let hitFilter = true;
    if (filter === 'active') hitFilter = c.remaining > 0;
    if (filter === 'inStock') hitFilter = c.remaining > 0;
    if (filter === 'soldOut') hitFilter = c.remaining === 0;
    if (filter === 'lowStock') hitFilter = c.remaining > 0 && c.remaining <= 3;
    return hitKeyword && hitCategory && hitFilter;
  });

  const mode = sortFilter?.value || 'updated_desc';
  list.sort((a, b) => {
    const ca = calc(a);
    const cb = calc(b);
    if (mode === 'stock_asc') return ca.remaining - cb.remaining;
    if (mode === 'profit_desc') return cb.realizedProfit - ca.realizedProfit;
    if (mode === 'price_desc') return cb.estimatedPrice - ca.estimatedPrice;
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
      ? `第 ${inventoryPage} / ${totalPages} 页 · 共 ${inventoryTotalCount} 条`
      : '暂无匹配库存';
  }
  renderPageNumbers(pageNumbers, inventoryPage, totalPages, 'inventory');
  if (firstPageBtn) firstPageBtn.disabled = loading || inventoryPage <= 1 || totalPages === 0;
  if (prevPageBtn) prevPageBtn.disabled = loading || inventoryPage <= 1 || totalPages === 0;
  if (nextPageBtn) nextPageBtn.disabled = loading || inventoryPage >= totalPages || totalPages === 0;
  if (lastPageBtn) lastPageBtn.disabled = loading || inventoryPage >= totalPages || totalPages === 0;
}

function updateSalesPaginationControls() {
  const filteredCount = getFilteredSaleLogs().length;
  const totalPages = getSalesPageCount();
  if (salesPageInfo) {
    salesPageInfo.textContent = totalPages
      ? `第 ${salesPage} / ${totalPages} 页 · 共 ${filteredCount} 条`
      : '暂无卖出记录';
  }
  renderPageNumbers(salesPageNumbers, salesPage, totalPages, 'sales');
  if (firstSalesPageBtn) firstSalesPageBtn.disabled = loading || salesPage <= 1 || totalPages === 0;
  if (prevSalesPageBtn) prevSalesPageBtn.disabled = loading || salesPage <= 1 || totalPages === 0;
  if (nextSalesPageBtn) nextSalesPageBtn.disabled = loading || salesPage >= totalPages || totalPages === 0;
  if (lastSalesPageBtn) lastSalesPageBtn.disabled = loading || salesPage >= totalPages || totalPages === 0;
}

function updateSearchClearButton() {
  if (!clearSearchBtn || !searchInput) return;
  clearSearchBtn.classList.toggle('show', !!searchInput.value.trim());
}

function renderSearchMeta() {
  if (!searchResultMeta) return;
  const keyword = normalizeSearchTerm(searchInput.value);
  if (!keyword) {
    searchResultMeta.hidden = true;
    searchResultMeta.textContent = '';
    return;
  }

  searchResultMeta.hidden = false;
  searchResultMeta.innerHTML = `关键词：<strong>${escapeHtml(keyword)}</strong> · 匹配 <strong>${inventoryTotalCount}</strong> 条`;
}

function renderWorkbench() {
  if (!workbenchGrid) return;
  updateProfitMonthSelect();
  const summary = getInventorySummary();
  const periodData = computePeriodStatsEx(currentPeriod);
  
  const todayStats = computePeriodStatsEx('today');
  const monthStats = computePeriodStatsEx('month');
  const yearStats = computePeriodStatsEx('year');
  const allStats = computePeriodStatsEx('all');
  
  const cumulativeRealizedProfit = allStats.profit;
  const remainingPotentialProfit = items.reduce((sum, item) => sum + calc(item).potentialProfit, 0);
  
  const monthLabel = selectedProfitMonth === getMonthKey(new Date())
    ? '本月'
    : formatMonthLabel(selectedProfitMonth);
    
  const labelMap = {
    today: '今日',
    month: monthLabel,
    year: '今年',
    all: '累计'
  };
  const periodLabel = labelMap[currentPeriod] || '统计';
  
  const lowCount = toNumber(summary.low_stock_count);
  const metric = (label, value, strong = false) => `
    <div class="dashboard-metric ${strong ? 'strong' : ''}">
      <div class="k">${label}</div>
      <div class="v">${value}</div>
    </div>
  `;
  const detailRow = (label, value) => `<div class="dashboard-detail-row"><span>${label}</span><strong>${value}</strong></div>`;

  workbenchGrid.innerHTML = `
    <div class="dashboard-board">
      <div class="dashboard-group">
        <div class="dashboard-group-head">
          <span>${periodLabel}业绩</span>
        </div>
        <div class="dashboard-metrics">
          ${metric('利润', moneyShort(periodData.profit), true)}
          ${metric('销售额', moneyShort(periodData.revenue))}
          ${metric('卖出', `${periodData.qty} 件`)}
        </div>
      </div>

      <div class="dashboard-group">
        <div class="dashboard-group-head">
          <span>实时库存</span>
        </div>
        <div class="dashboard-metrics">
          ${metric('剩余库存', `${toNumber(summary.remaining_units)} 件`, true)}
          ${metric('商品种类', toNumber(summary.total_products))}
          ${metric('总成本', moneyShort(summary.total_cost))}
        </div>
      </div>

      ${lowCount ? `<button type="button" class="dashboard-alert" data-low-stock-filter="true">低库存：${lowCount} 个商品需要处理</button>` : ''}

      <details class="dashboard-details">
        <summary>展开更多数据</summary>
        <div class="dashboard-detail-body">
          <div class="dashboard-detail-group">
            <div class="dashboard-detail-title">库存明细</div>
            <div class="dashboard-detail-list">
              ${detailRow('进货总数量', `${toNumber(summary.total_units)} 件`)}
              ${detailRow('已售数量', `${toNumber(summary.sold_units)} 件`)}
              ${detailRow('低库存', `${lowCount} 个`)}
              ${detailRow('剩余库存估值', money(summary.remaining_market_value))}
              ${detailRow('预计利润', money(remainingPotentialProfit))}
            </div>
          </div>
          <div class="dashboard-detail-group">
            <div class="dashboard-detail-title">销售明细</div>
            <div class="dashboard-detail-list">
              ${detailRow('今日利润 / 销售额', `${money(todayStats.profit)} / ${money(todayStats.revenue)}`)}
              ${detailRow(`${monthLabel}利润 / 销售额`, `${money(monthStats.profit)} / ${money(monthStats.revenue)}`)}
              ${detailRow('今年利润 / 销售额', `${money(yearStats.profit)} / ${money(yearStats.revenue)}`)}
              ${detailRow('累计利润 / 销售额', `${money(allStats.profit)} / ${money(allStats.revenue)}`)}
            </div>
          </div>
        </div>
      </details>
    </div>
  `;
}

async function loadInventoryPage({ page = inventoryPage, keepPage = true } = {}) {
  const requestId = ++inventoryRequestSeq;
  const targetPage = Math.max(1, page || 1);
  inventoryPage = targetPage;
  loading = true;
  setSyncStatus('<strong>同步中：</strong>正在加载库存和统计数据...');
  updatePaginationControls();

  try {
    const [
      { data: itemsData, error: itemsError },
      { data: salesData, error: salesError },
      { data: summaryData, error: summaryError }
    ] = await Promise.all([
      supabaseClient.from(INVENTORY_TABLE).select('*').order('updated_at', { ascending: false }),
      supabaseClient.from('sales').select('*').order('sold_at', { ascending: false }),
      supabaseClient.rpc('inventory_summary')
    ]);

    if (requestId !== inventoryRequestSeq) return;
    if (itemsError) throw itemsError;
    if (salesError) console.warn(salesError);
    if (summaryError) console.warn(summaryError);

    const allItems = itemsData || [];
    saleLogs = salesData || [];
    items = allItems;
    inventoryMode = 'direct';
    inventorySummary = summaryData?.[0] || buildFallbackInventorySummary(allItems);
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

function getAvailableProfitMonths() {
  const months = new Set([getMonthKey(new Date())]);
  saleLogs.forEach((row) => {
    const d = new Date(row.sold_at);
    if (!Number.isNaN(d.getTime())) months.add(getMonthKey(d));
  });
  return [...months].sort((a, b) => b.localeCompare(a));
}

function updateProfitMonthSelect() {
  if (!profitMonthSelect) return;
  const months = getAvailableProfitMonths();
  if (!months.includes(selectedProfitMonth)) {
    selectedProfitMonth = months[0] || getMonthKey(new Date());
  }
  profitMonthSelect.innerHTML = months.map((month) => (
    `<option value="${month}" ${month === selectedProfitMonth ? 'selected' : ''}>${formatMonthLabel(month)}</option>`
  )).join('');
}

function computePeriodStatsEx(period, monthKey = selectedProfitMonth) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dStart = new Date(y, m, now.getDate(), 0, 0, 0, 0).getTime();
  const dEnd = new Date(y, m, now.getDate(), 23, 59, 59, 999).getTime();
  
  const {start: mStart, end: mEnd} = getMonthRange(monthKey);
  
  const yStart = new Date(y, 0, 1, 0, 0, 0, 0).getTime();
  const yEnd = new Date(y, 11, 31, 23, 59, 59, 999).getTime();
  
  let filteredLogs = [];
  if (period === 'today') {
    filteredLogs = saleLogs.filter(x => { const t = new Date(x.sold_at).getTime(); return t >= dStart && t <= dEnd; });
  } else if (period === 'month') {
    filteredLogs = saleLogs.filter(x => { const t = new Date(x.sold_at).getTime(); return t >= mStart && t <= mEnd; });
  } else if (period === 'year') {
    filteredLogs = saleLogs.filter(x => { const t = new Date(x.sold_at).getTime(); return t >= yStart && t <= yEnd; });
  } else {
    // 'all'
    filteredLogs = saleLogs;
  }
  
  const sum = (arr, key) => arr.reduce((a,b) => a + toNumber(b[key]), 0);
  return {
    qty: sum(filteredLogs, 'quantity'),
    revenue: sum(filteredLogs, 'revenue'),
    profit: sum(filteredLogs, 'profit')
  };
}

function renderInventoryList() {
  const keyword = normalizeSearchTerm(searchInput.value);
  const list = inventoryPageRows;
  if (emptyState) {
    emptyState.hidden = !!list.length;
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
    const lowClass = c.remaining > 0 && c.remaining <= 3 ? 'low-stock' : '';
    const soldOutClass = c.remaining === 0 ? 'sold-out' : '';
    const soldPercent = c.quantity > 0 ? Math.round((c.soldQuantity / c.quantity) * 100) : 0;
    const strokeDasharray = 125.66;
    const strokeDashoffset = strokeDasharray - (soldPercent / 100) * strokeDasharray;
    
    const noteHtml = item.note
      ? `<div class="inventory-note">备注：${highlightKeyword(item.note, keyword)}</div>`
      : '';
    const detailHtml = [
      item.supplier ? `<div><span>供货渠道：</span><strong>${highlightKeyword(item.supplier, keyword)}</strong></div>` : '',
      item.location ? `<div><span>存放位置：</span><strong>${highlightKeyword(item.location, keyword)}</strong></div>` : ''
    ].filter(Boolean).join('');
    
    return `
      <div class="inventory-item ${lowClass} ${soldOutClass}">
        <div class="inventory-card-top">
          <div class="inventory-card-info">
            <h3 class="inventory-name">${highlightKeyword(item.name, keyword)}</h3>
            <div class="inventory-sub">
              <span class="tag gray">${highlightKeyword(item.category || '未分类', keyword)}</span>
              ${item.sku ? `<span class="tag gray" style="margin-left:4px;">${highlightKeyword(item.sku, keyword)}</span>` : ''}
            </div>
          </div>
          <div class="inventory-progress-ring ${c.remaining === 0 ? 'sold-out' : (c.remaining <= 3 ? 'low' : '')}">
            <svg>
              <circle class="bg-ring" cx="24" cy="24" r="20" />
              <circle class="fill-ring" cx="24" cy="24" r="20" stroke-dasharray="125.66" stroke-dashoffset="${strokeDashoffset}" />
            </svg>
            <span class="ring-text">${soldPercent}%</span>
          </div>
        </div>

        <div class="inventory-item-specs">
          <div class="inventory-spec-pill">
            <span class="k">进价</span>
            <span class="v">${money(c.costPrice)}</span>
          </div>
          <div class="inventory-spec-pill">
            <span class="k">预估售价</span>
            <span class="v">${moneyOrPending(c.estimatedPrice)}</span>
          </div>
          <div class="inventory-spec-pill">
            <span class="k">剩余 / 进货</span>
            <span class="v">${c.remaining} / ${c.quantity}</span>
          </div>
        </div>

        ${detailHtml ? `<div class="inventory-item-details">${detailHtml}</div>` : ''}
        ${noteHtml}

        <div class="inventory-card-actions">
          <button type="button" class="primary" onclick="sellItem('${item.id}')" ${c.remaining === 0 ? 'disabled' : ''}>登记卖出</button>
          <button type="button" class="secondary" onclick="editItem('${item.id}')">编辑</button>
          <button type="button" class="danger" onclick="deleteItem('${item.id}')">删除</button>
        </div>
      </div>
    `;
  }).join('');

  updatePaginationControls();
}

function renderInventoryTable() {
  if (!tableBody) return;
  const list = inventoryPageRows;
  tableBody.innerHTML = list.map((item) => {
    const c = calc(item);
    return `
      <tr>
        <td>
          <div class="table-item-name">${escapeHtml(item.name)}</div>
          <div class="table-item-sub">${escapeHtml(item.supplier || '-')} · ${escapeHtml(item.location || '-')}</div>
        </td>
        <td>${escapeHtml(item.category || '-')}</td>
        <td>${escapeHtml(item.sku || '-')}</td>
        <td class="num">${money(c.costPrice)}</td>
        <td class="num">${moneyOrPending(c.estimatedPrice)}</td>
        <td class="num">${c.quantity}</td>
        <td class="num">${c.soldQuantity}</td>
        <td class="num">${c.remaining}<br>${stockTag(c.remaining)}</td>
        <td class="num">${money(c.totalCost)}</td>
        <td class="num money ${c.realizedProfit >= 0 ? 'pos' : 'neg'}">${money(c.realizedProfit)}</td>
        <td class="num money ${c.potentialProfit >= 0 ? 'pos' : 'neg'}">${money(c.potentialProfit)}</td>
        <td class="num">${percent(c.profitMargin)}</td>
        <td><div class="table-note">${escapeHtml(item.note || '-')}</div></td>
        <td class="actions-col">
          <div class="table-actions">
            <button class="primary" onclick="sellItem('${item.id}')">登记卖出</button>
            <button class="secondary" onclick="editItem('${item.id}')">编辑商品</button>
            <button class="danger" onclick="deleteItem('${item.id}')">删除</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function render() {
  updateSearchClearButton();
  renderCategoryFilterOptions();
  renderQuickCategoryChips();
  renderSearchMeta();
  renderWorkbench();
  renderSaleRecords();
  renderInventoryList();
  renderInventoryTable();
}

function renderSaleRecords() {
  const filteredSaleLogs = getFilteredSaleLogs();
  if (!saleLogs.length) {
    saleRecords.className = 'empty';
    saleRecords.textContent = '暂无卖出记录。';
    updateSalesPaginationControls();
    return;
  }
  if (!filteredSaleLogs.length) {
    saleRecords.className = 'empty';
    saleRecords.textContent = '当前分类暂无卖出记录。';
    salesPage = 1;
    updateSalesPaginationControls();
    return;
  }
  const totalPages = getSalesPageCount();
  if (totalPages && salesPage > totalPages) {
    salesPage = totalPages;
  }
  const start = (Math.max(1, salesPage) - 1) * SALES_PAGE_SIZE;
  const rows = [...filteredSaleLogs]
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
            ${getSaleCategory(r) ? `<span class="sale-mobile-chip"><strong>分类</strong>${escapeHtml(getSaleCategory(r))}</span>` : ''}
            <span class="sale-mobile-chip"><strong>单价</strong>${money(r.sale_price)}</span>
            <span class="sale-mobile-chip"><strong>销售额</strong>${money(r.revenue)}</span>
            ${r.note ? `<span class="sale-mobile-chip"><strong>备注</strong>${escapeHtml(r.note)}</span>` : ''}
          </div>
          <div class="sale-mobile-actions">
            <button type="button" class="ghost sale-delete-btn" onclick="editSaleRecordTime('${r.id}')">编辑时间</button>
            <button type="button" class="danger sale-delete-btn" onclick="deleteSaleRecord('${r.id}')">删除并恢复库存</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="table-wrap">
      <table class="sales-table">
        <thead>
          <tr><th>时间</th><th>商品</th><th>分类</th><th class="num">数量</th><th class="num">成交单价</th><th class="num">销售额</th><th class="num">利润</th><th>备注</th><th class="actions-col">操作</th></tr>
        </thead>
        <tbody>
          ${rows.map(r=>`<tr>
            <td>${escapeHtml(new Date(r.sold_at).toLocaleString('zh-CN'))}</td>
            <td>${escapeHtml(r.item_name || '-')}</td>
            <td>${escapeHtml(getSaleCategory(r) || '-')}</td>
            <td class="num">${r.quantity}</td>
            <td class="num">${money(r.sale_price)}</td>
            <td class="num">${money(r.revenue)}</td>
            <td class="num money ${toNumber(r.profit)>=0?'pos':'neg'}">${money(r.profit)}</td>
            <td><div class="table-note">${escapeHtml(r.note || '-')}</div></td>
            <td class="actions-col">
              <button type="button" class="ghost sale-delete-btn" onclick="editSaleRecordTime('${r.id}')">编辑时间</button>
              <button type="button" class="danger sale-delete-btn" onclick="deleteSaleRecord('${r.id}')">删除并恢复库存</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
  updateSalesPaginationControls();
}

async function removeSaleRecord(id) {
  const sale = saleLogs.find((row) => row.id === id);
  if (!sale) return;
  if (!confirm(`二次确认：确定删除卖出记录「${sale.item_name || '未命名商品'}」吗？\n删除后会恢复 ${toNumber(sale.quantity)} 件库存。`)) return;

  const { error } = await supabaseClient.rpc('delete_sale_record', {
    p_sale_id: id
  });

  if (error) {
    alert('删除卖出记录失败：' + error.message);
    return;
  }

  await refreshInventory();
  showToast(`已删除卖出记录：${sale.item_name || '未命名商品'}，库存已恢复`);
}

async function updateSaleRecordTime(id) {
  openSaleTimeEditModal(id);
}

function setSaleTimeEditSubmitting(active) {
  saleTimeEditSubmitting = !!active;
  if (saleTimeEditSubmitBtn) {
    saleTimeEditSubmitBtn.disabled = saleTimeEditSubmitting;
    saleTimeEditSubmitBtn.textContent = saleTimeEditSubmitting ? '正在保存...' : '保存时间';
  }
}

function openSaleTimeEditModal(id) {
  const sale = saleLogs.find((row) => row.id === id);
  if (!sale || !saleTimeEditModal || !saleTimeEditInput) return;
  editingSaleTimeId = id;
  setSaleTimeEditSubmitting(false);
  if (saleTimeEditDesc) {
    saleTimeEditDesc.innerHTML = `
      <strong>${escapeHtml(sale.item_name || '未命名商品')}</strong>
      当前时间：${escapeHtml(new Date(sale.sold_at).toLocaleString('zh-CN'))}
    `;
  }
  saleTimeEditInput.value = toDatetimeLocalValue(sale.sold_at);
  saleTimeEditModal.classList.add('show');
  lockPageScroll();
}

function closeSaleTimeEditModal() {
  editingSaleTimeId = null;
  setSaleTimeEditSubmitting(false);
  saleTimeEditForm?.reset();
  saleTimeEditModal?.classList.remove('show');
  unlockPageScroll();
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
  setSaleSubmitting(false);
  saleModalDesc.innerHTML = `
    <strong>${escapeHtml(item.name)}</strong>
    当前剩余库存：${c.remaining} 件<br>
    默认预估售价：${money(c.estimatedPrice)}
  `;
  saleQuantityInput.value = '1';
  saleQuantityInput.max = String(c.remaining);
  salePriceInput.value = c.estimatedPrice || '';
  if (saleTimeInput) saleTimeInput.value = toDatetimeLocalValue();
  saleNoteInput.value = '';
  saleModal.classList.add('show');
  lockPageScroll();
  updateSaleModalProfitHighlight();
  if (shouldAutoFocusSaleInput()) {
    setTimeout(() => {
      saleQuantityInput.focus();
      saleQuantityInput.select();
    }, 80);
  }
}

function closeSaleModal() {
  saleItemId = null;
  setSaleSubmitting(false);
  saleQuantityInput.removeAttribute('max');
  saleForm.reset();
  saleModal.classList.remove('show');
  unlockPageScroll();
}

function setSaleSubmitting(active) {
  saleSubmitting = !!active;
  if (saleSubmitBtn) {
    saleSubmitBtn.disabled = saleSubmitting;
    saleSubmitBtn.textContent = saleSubmitting ? '正在登记...' : '确认登记卖出';
  }
}

function setActiveCategoryChip(value = '') {
  document.querySelectorAll('.category-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.category === value);
  });
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

function switchFormTab(tabName) {
  document.querySelectorAll('.form-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.form-tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `${tabName}FieldsPane`);
  });
}

function applyQuickEntryMode() {
  const tabNav = document.querySelector('.form-tab-nav');
  if (quickEntryMode?.checked) {
    if (tabNav) tabNav.style.display = 'none';
    switchFormTab('primary');
    if (saveAndNextBtn) saveAndNextBtn.style.display = '';
    if (submitBtn) submitBtn.textContent = '保存商品';
  } else {
    if (tabNav) tabNav.style.display = 'flex';
    if (saveAndNextBtn) saveAndNextBtn.style.display = 'none';
    if (submitBtn) submitBtn.textContent = '保存全部信息';
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
  if (resetBtn) resetBtn.textContent = '清空表单';

  if (keepFormValuesForNext) {
    document.getElementById('category').value = previousCategory || '';
    document.getElementById('location').value = previousLocation || '';
    document.getElementById('supplier').value = previousSupplier || '';
    setActiveCategoryChip(previousCategory || '');
    keepFormValuesForNext = false;
    setTimeout(() => {
      switchFormTab('primary');
      scrollToSection('formSection');
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
  const marketPrice = toNumber(document.getElementById('marketPrice').value);
  return {
    id: generateUUID(),
    name: document.getElementById('name').value.trim(),
    category: document.getElementById('category').value.trim(),
    sku: document.getElementById('sku').value.trim(),
    supplier: document.getElementById('supplier').value.trim(),
    cost_price: toNumber(document.getElementById('costPrice').value),
    market_price: marketPrice,
    sell_price: 0,
    quantity: Math.max(0, Math.floor(toNumber(document.getElementById('quantity').value))),
    sold_quantity: 0,
    location: document.getElementById('location').value.trim(),
    note: document.getElementById('note').value.trim(),
    updated_at: new Date().toISOString()
  };
}

function getEditFormData(existingItem) {
  return {
    id: existingItem.id,
    name: editNameInput.value.trim(),
    category: editCategoryInput.value.trim(),
    sku: editSkuInput.value.trim(),
    supplier: editSupplierInput.value.trim(),
    cost_price: toNumber(editCostPriceInput.value),
    market_price: toNumber(editMarketPriceInput.value),
    sell_price: toNumber(existingItem.sell_price),
    quantity: Math.max(0, Math.floor(toNumber(editQuantityInput.value))),
    sold_quantity: Math.max(0, Math.floor(toNumber(existingItem.sold_quantity))),
    location: editLocationInput.value.trim(),
    note: editNoteInput.value.trim(),
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
    sell_price: toNumber(existingItem.sell_price),
    quantity: Math.max(0, Math.floor(toNumber(existingItem.quantity) + toNumber(incomingItem.quantity))),
    sold_quantity: Math.max(0, Math.floor(toNumber(existingItem.sold_quantity))),
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

async function findSameNameDifferentCostItems(data) {
  const { data: matches, error } = await supabaseClient
    .from('items')
    .select('id,name,sku,cost_price,quantity,sold_quantity')
    .eq('name', data.name)
    .limit(20);

  if (error) throw error;
  return (matches || []).filter((item) => toNumber(item.cost_price) !== toNumber(data.cost_price));
}

function formatDifferentCostBatchList(rows) {
  return rows.slice(0, 5).map((item) => {
    const c = calc(item);
    const sku = item.sku ? `，SKU：${item.sku}` : '';
    return `- 进价 ${money(c.costPrice)}，剩余 ${c.remaining} 件${sku}`;
  }).join('\n');
}

function setEditSubmitting(active) {
  editSubmitting = !!active;
  if (editSubmitBtn) {
    editSubmitBtn.disabled = editSubmitting;
    editSubmitBtn.textContent = editSubmitting ? '正在更新...' : '更新这条库存';
  }
}

function openEditModal(id) {
  const item = items.find((row) => row.id === id);
  if (!item) return;
  const c = calc(item);
  editingId = id;
  setEditSubmitting(false);
  editModalDesc.innerHTML = `
    <strong>${escapeHtml(item.name || '未命名商品')}</strong>
    当前已售：${c.soldQuantity} 件，剩余：${c.remaining} 件<br>
    保存后只更新这条库存记录，不修改历史卖出利润。
  `;
  editNameInput.value = item.name || '';
  editCategoryInput.value = item.category || '';
  editSkuInput.value = item.sku || '';
  editSupplierInput.value = item.supplier || '';
  editCostPriceInput.value = item.cost_price ?? '';
  editMarketPriceInput.value = item.market_price ?? '';
  editQuantityInput.value = item.quantity ?? '';
  editQuantityInput.min = String(c.soldQuantity);
  editLocationInput.value = item.location || '';
  editNoteInput.value = item.note || '';
  editModal.classList.add('show');
  lockPageScroll();
  if (shouldAutoFocusSaleInput()) {
    setTimeout(() => {
      editNameInput.focus();
      editNameInput.select?.();
    }, 80);
  }
}

function closeEditModal() {
  editingId = null;
  setEditSubmitting(false);
  editQuantityInput.removeAttribute('min');
  editForm.reset();
  editModal.classList.remove('show');
  unlockPageScroll();
}

async function removeItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (!confirm(`二次确认：确定删除商品「${item.name}」吗？\n这个商品关联的卖出记录也会一起删除。`)) return;

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
  showToast(`已删除：${item.name || '未命名商品'}`);
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
      '商品名称','分类','SKU','供货渠道','进价','预估售价','进货数量','已售数量','剩余库存','总成本','已实现利润','预计利润','预估利润率','存放位置','备注','更新时间'
    ]];
    allItems.forEach(item => {
      const c = calc(item);
      rows.push([
        item.name, item.category, item.sku, item.supplier,
        c.costPrice, c.estimatedPrice,
        c.quantity, c.soldQuantity, c.remaining,
        c.totalCost, c.realizedProfit, c.potentialProfit, c.profitMargin,
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
    showToast('已导出 CSV');
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

  let error = null;

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
    const differentCostItems = await findSameNameDifferentCostItems(data);
    if (differentCostItems.length) {
      const shouldCreateSeparateBatch = confirm([
        `已存在同名商品「${data.name}」，但进价和这次不同。`,
        '',
        '已有批次：',
        formatDifferentCostBatchList(differentCostItems),
        '',
        `这次进价：${money(data.cost_price)}`,
        '',
        '建议作为独立批次保存，这样利润会按各自进价计算。',
        '确定继续新增独立批次吗？'
      ].join('\n'));
      if (!shouldCreateSeparateBatch) return;
    }
    ({ error } = await supabaseClient.from('items').insert(data));
  }

  if (error) {
    alert('保存失败：' + error.message);
    return;
  }
  await applyQuickEntryMode();
  await refreshInventory({ resetPage: true });
  const savedName = data.name || '未命名商品';
  const toastText = keepFormValuesForNext
    ? `已保存：${savedName}，继续录入下一条`
    : `已保存：${savedName}`;
  resetForm();
  showToast(toastText);
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
if (categoryFilter) categoryFilter.addEventListener('change', () => refreshInventory({ resetPage: true }));
if (clearSearchBtn) clearSearchBtn.addEventListener('click', () => { searchInput.value = ''; updateSearchClearButton(); refreshInventory({ resetPage: true }); searchInput.focus(); });
if (sortFilter) sortFilter.addEventListener('change', () => refreshInventory({ resetPage: true }));
async function goToInventoryPage(page) {
  const totalPages = getInventoryPageCount();
  if (!totalPages) return;
  const targetPage = Math.min(Math.max(1, Math.floor(toNumber(page))), totalPages);
  if (targetPage === inventoryPage) return;
  inventoryPage = targetPage;
  await refreshInventory();
  scrollToAnchoredSection('listSection');
}

function goToSalesPage(page) {
  const totalPages = getSalesPageCount();
  if (!totalPages) return;
  const targetPage = Math.min(Math.max(1, Math.floor(toNumber(page))), totalPages);
  if (targetPage === salesPage) return;
  salesPage = targetPage;
  renderSaleRecords();
  scrollToAnchoredSection('salesCard');
}

if (firstPageBtn) firstPageBtn.addEventListener('click', () => goToInventoryPage(1));
if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
  goToInventoryPage(inventoryPage - 1);
});
if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
  goToInventoryPage(inventoryPage + 1);
});
if (lastPageBtn) lastPageBtn.addEventListener('click', () => {
  goToInventoryPage(getInventoryPageCount());
});
if (pageNumbers) pageNumbers.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-page-target="inventory"]');
  if (!trigger) return;
  goToInventoryPage(trigger.dataset.page);
});
if (profitMonthSelect) profitMonthSelect.addEventListener('change', () => {
  selectedProfitMonth = profitMonthSelect.value || getMonthKey(new Date());
  renderWorkbench();
});
if (firstSalesPageBtn) firstSalesPageBtn.addEventListener('click', () => goToSalesPage(1));
if (prevSalesPageBtn) prevSalesPageBtn.addEventListener('click', () => {
  goToSalesPage(salesPage - 1);
});
if (nextSalesPageBtn) nextSalesPageBtn.addEventListener('click', () => {
  goToSalesPage(salesPage + 1);
});
if (lastSalesPageBtn) lastSalesPageBtn.addEventListener('click', () => {
  goToSalesPage(getSalesPageCount());
});
if (salesPageNumbers) salesPageNumbers.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-page-target="sales"]');
  if (!trigger) return;
  goToSalesPage(trigger.dataset.page);
});
if (salesCategoryFilter) salesCategoryFilter.addEventListener('change', () => {
  salesPage = 1;
  renderSaleRecords();
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
    showToast('已生成备份 JSON');
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
      '二次确认：这会先清空 Supabase 里的当前数据，再导入备份。',
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
    showToast(`已恢复：${data.items.length} 条商品，${importedSales.length} 条卖出记录`);
  } catch (err) {
    alert('恢复失败：' + (err?.message || '文件格式错误'));
  } finally {
    restoreFile.value = '';
  }
});

editCancelBtn.addEventListener('click', closeEditModal);
editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (editSubmitting) return;
  const existingItem = editingId ? items.find((item) => item.id === editingId) : null;
  if (!existingItem) {
    alert('当前编辑的商品没有在最新库存里找到，请刷新后重新编辑。');
    await refreshInventory();
    closeEditModal();
    return;
  }

  const data = getEditFormData(existingItem);
  if (!data.name) {
    alert('请填写商品名称。');
    return;
  }
  if (data.quantity < data.sold_quantity) {
    alert(`进货数量不能小于已售数量（当前已售 ${data.sold_quantity}）。如果要修正已售，请先处理卖出记录。`);
    return;
  }

  setEditSubmitting(true);
  try {
    const { id, ...updateData } = data;
    const { data: updatedItem, error } = await supabaseClient
      .from('items')
      .update(updateData)
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) {
      alert('更新失败：' + error.message);
      return;
    }
    if (!updatedItem) {
      alert('更新失败：没有找到要编辑的商品，请刷新后重新编辑。');
      await refreshInventory();
      closeEditModal();
      return;
    }

    await refreshInventory();
    closeEditModal();
    showToast(`已更新：${data.name || '未命名商品'}`);
  } finally {
    setEditSubmitting(false);
  }
});

saleCancelBtn.addEventListener('click', closeSaleModal);
saleModal.addEventListener('click', (e) => {
  if (e.target === saleModal) closeSaleModal();
});
saleForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (saleSubmitting) return;
  const item = items.find(i => i.id === saleItemId);
  if (!item) return closeSaleModal();
  const c = calc(item);
  const saleQty = Math.max(1, Math.floor(toNumber(saleQuantityInput.value)));
  const salePrice = toNumber(salePriceInput.value || c.estimatedPrice);
  const soldAt = getSaleTimeIso();
  const saleNote = saleNoteInput.value.trim();
  if (!soldAt) return;
  if (saleQty > c.remaining) {
    alert(`卖出数量不能大于剩余库存（当前剩余 ${c.remaining}）。`);
    return;
  }

  setSaleSubmitting(true);
  try {
    const { error } = await supabaseClient.rpc('register_sale', {
      p_item_id: item.id,
      p_qty: saleQty,
      p_sale_price: salePrice,
      p_sold_at: soldAt,
      p_note: saleNote
    });

    if (error) {
      alert('登记卖出失败：' + error.message);
      return;
    }

    await applyQuickEntryMode();
    await refreshInventory();
    closeSaleModal();
    showToast(`已登记卖出：${item.name || '未命名商品'} × ${saleQty}`);
  } finally {
    setSaleSubmitting(false);
  }
});

if (saleTimeEditCancelBtn) saleTimeEditCancelBtn.addEventListener('click', closeSaleTimeEditModal);
if (saleTimeEditModal) saleTimeEditModal.addEventListener('click', (e) => {
  if (e.target === saleTimeEditModal) closeSaleTimeEditModal();
});
if (saleTimeEditForm) saleTimeEditForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (saleTimeEditSubmitting) return;
  const sale = editingSaleTimeId ? saleLogs.find((row) => row.id === editingSaleTimeId) : null;
  if (!sale) {
    closeSaleTimeEditModal();
    return;
  }
  const nextDate = new Date(saleTimeEditInput?.value || '');
  if (Number.isNaN(nextDate.getTime())) {
    alert('请选择有效的卖出时间。');
    return;
  }

  setSaleTimeEditSubmitting(true);
  try {
    const { error } = await supabaseClient
      .from('sales')
      .update({ sold_at: nextDate.toISOString() })
      .eq('id', sale.id);
    if (error) {
      alert('更新时间失败：' + error.message);
      return;
    }
    await refreshInventory();
    closeSaleTimeEditModal();
    showToast(`已更新时间：${sale.item_name || '未命名商品'}`);
  } finally {
    setSaleTimeEditSubmitting(false);
  }
});

window.editItem = function(id) {
  openEditModal(id);
}

window.deleteItem = function(id) {
  removeItem(id);
}

window.sellItem = function(id) {
  openSaleModal(id);
}

window.deleteSaleRecord = function(id) {
  removeSaleRecord(id);
}

window.editSaleRecordTime = function(id) {
  updateSaleRecordTime(id);
}

if (quickCategoryRow) {
  quickCategoryRow.addEventListener('click', (event) => {
    const chip = event.target.closest('.category-chip');
    if (!chip) return;
    const categoryInput = document.getElementById('category');
    categoryInput.value = chip.dataset.category || '';
    setActiveCategoryChip(chip.dataset.category || '');
  });
}

function updateSaleModalProfitHighlight() {
  const highlightEl = document.getElementById('saleProfitHighlight');
  if (!highlightEl || !saleItemId) return;
  const item = items.find(i => i.id === saleItemId);
  if (!item) return;
  
  const saleQty = Math.max(0, Math.floor(toNumber(saleQuantityInput.value)));
  const salePrice = toNumber(salePriceInput.value || calc(item).estimatedPrice);
  const costPrice = toNumber(item.cost_price);
  
  const profit = (salePrice - costPrice) * saleQty;
  highlightEl.textContent = `预计可赚利润: ${money(profit)}`;
}

// Floating tab bar click scroll handler
document.querySelectorAll('.floating-tab-bar .tab-item').forEach((item) => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = item.dataset.tabNav;
    if (targetId) {
      if (targetId === 'dashboardSection') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        scrollToAnchoredSection(targetId);
      }
    }
  });
});

// Scroll observer to highlight active tab item
function initScrollObserver() {
  const sections = [
    { id: 'dashboardSection' },
    { id: 'listSection' },
    { id: 'formSection' },
    { id: 'salesCard' }
  ];
  
  const navItems = document.querySelectorAll('.floating-tab-bar .tab-item');
  
  const observerOptions = {
    root: null,
    rootMargin: '-15% 0px -70% 0px',
    threshold: 0
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navItems.forEach((item) => {
          const isActive = item.dataset.tabNav === id;
          item.classList.toggle('active', isActive);
        });
      }
    });
  }, observerOptions);
  
  sections.forEach((s) => {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  });
}

// Quantity adjust step buttons
const minusBtn = document.getElementById('saleQtyMinus');
const plusBtn = document.getElementById('saleQtyPlus');

if (minusBtn && plusBtn) {
  minusBtn.addEventListener('click', () => {
    let val = Math.max(1, Math.floor(toNumber(saleQuantityInput.value) - 1));
    saleQuantityInput.value = String(val);
    updateSaleModalProfitHighlight();
  });
  
  plusBtn.addEventListener('click', () => {
    const item = items.find(i => i.id === saleItemId);
    if (!item) return;
    const c = calc(item);
    let val = Math.min(c.remaining, Math.floor(toNumber(saleQuantityInput.value) + 1));
    saleQuantityInput.value = String(val);
    updateSaleModalProfitHighlight();
  });
}

saleQuantityInput.addEventListener('input', updateSaleModalProfitHighlight);
salePriceInput.addEventListener('input', updateSaleModalProfitHighlight);

// Form tab click handler
document.querySelectorAll('.form-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchFormTab(btn.dataset.tab);
  });
});

// Period tabs listener
const periodTabsContainer = document.getElementById('dashboardPeriodTabs');
if (periodTabsContainer) {
  periodTabsContainer.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.dashboard-period-tab');
    if (!tabBtn) return;
    
    periodTabsContainer.querySelectorAll('.dashboard-period-tab').forEach(btn => {
      btn.classList.toggle('active', btn === tabBtn);
    });
    
    currentPeriod = tabBtn.dataset.period;
    
    const monthSelectWrap = document.getElementById('monthSelectWrap');
    if (monthSelectWrap) {
      monthSelectWrap.style.display = currentPeriod === 'month' ? 'flex' : 'none';
    }
    
    renderWorkbench();
  });
}

if (workbenchGrid) {
  workbenchGrid.addEventListener('click', (event) => {
    const lowStockTrigger = event.target.closest('[data-low-stock-filter]');
    if (lowStockTrigger) {
      if (stockFilter) stockFilter.value = 'lowStock';
      refreshInventory({ resetPage: true }).then(() => scrollToAnchoredSection('listSection'));
      return;
    }
    const trigger = event.target.closest('[data-target]');
    if (!trigger) return;
    scrollToAnchoredSection(trigger.dataset.target);
  });
}

// Call initScrollObserver
initScrollObserver();

applyQuickEntryMode();
renderQuickCategoryChips();
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

window.addEventListener('scroll', () => {
  const active = document.activeElement;
  if (isEditableTarget(active)) {
    active.blur();
  }
}, { passive: true });
