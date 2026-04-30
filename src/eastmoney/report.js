import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

const API_URL = 'https://np-anotice-stock.eastmoney.com/api/security/ann';
const SUGGEST_URL = 'https://searchadapter.eastmoney.com/api/suggest/get';

function buildDetailUrl(code, artCode) {
  return `https://data.eastmoney.com/notices/detail/${code || ''}/${artCode || ''}.html`;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function extractReportYear(title) {
  const match = normalizeText(title).match(
    /([12]\d{3})年(?:年度报告|年报|半年度报告|中期报告|一季度报告|三季度报告)/,
  );
  return match ? match[1] : '';
}

function getCategory(item) {
  return Array.isArray(item?.columns) && item.columns.length > 0
    ? normalizeText(item.columns[0]?.column_name)
    : '';
}

function getPrimaryCode(item) {
  return Array.isArray(item?.codes) && item.codes.length > 0 ? item.codes[0] : {};
}

function isStockCode(value) {
  return /^\d{6}$/.test(normalizeText(value));
}

const REPORT_FILTERS = {
  annual: ['annual'],
  semi: ['half', 'interim'],
  half: ['half'],
  interim: ['interim'],
  q1: ['q1'],
  q3: ['q3'],
};

const REPORT_ALIASES = {
  all: 'all',
  '*': 'all',
  annual: 'annual',
  yearly: 'annual',
  'full-year': 'annual',
  'full_year': 'annual',
  '12m': 'annual',
  '12month': 'annual',
  '12months': 'annual',
  '年报': 'annual',
  '年度报告': 'annual',
  '年度': 'annual',
  semi: 'semi',
  half: 'semi',
  interim: 'semi',
  midyear: 'semi',
  'mid-year': 'semi',
  'half-year': 'semi',
  'half_year': 'semi',
  '6m': 'semi',
  '6month': 'semi',
  '6months': 'semi',
  '半年报': 'semi',
  '半年度报告': 'semi',
  '半年度': 'semi',
  '中报': 'semi',
  '中期': 'semi',
  '中期报告': 'semi',
  q1: 'q1',
  quarter1: 'q1',
  'first-quarter': 'q1',
  'first_quarter': 'q1',
  '一季报': 'q1',
  '一季度': 'q1',
  '一季度报告': 'q1',
  q3: 'q3',
  quarter3: 'q3',
  'third-quarter': 'q3',
  'third_quarter': 'q3',
  '三季报': 'q3',
  '三季度': 'q3',
  '三季度报告': 'q3',
};

const MODE_ALIASES = {
  all: 'all',
  full: 'full',
  summary: 'summary',
  complete: 'full',
  detail: 'full',
  '全文': 'full',
  '完整': 'full',
  '完整版': 'full',
  '摘要': 'summary',
  '摘要版': 'summary',
  '简版': 'summary',
};

function getReportPeriod(title, category) {
  const text = `${normalizeText(title)} ${normalizeText(category)}`;
  if (text.includes('一季度报告')) return 'q1';
  if (text.includes('三季度报告')) return 'q3';
  if (text.includes('半年度报告')) return 'half';
  if (text.includes('中期报告')) return 'interim';
  if (text.includes('年度报告') || text.includes('年报')) return 'annual';
  return '';
}

function getReportType(title, category) {
  const period = getReportPeriod(title, category);
  if (!period) return '';
  const text = `${normalizeText(title)} ${normalizeText(category)}`;
  return text.includes('摘要') ? 'summary' : 'full';
}

function resolveReportFilter(value) {
  return REPORT_ALIASES[normalizeText(value).toLowerCase()] || 'all';
}

function resolveMode(value) {
  return MODE_ALIASES[normalizeText(value).toLowerCase()] || 'all';
}

function matchesReport(item, year, reportFilter, mode, stockQuery) {
  const title = normalizeText(item?.title || item?.title_ch);
  const category = getCategory(item);
  const reportPeriod = getReportPeriod(title, category);
  const reportType = getReportType(title, category);
  if (!reportPeriod || !reportType) return false;

  if (year && extractReportYear(title) !== String(year)) return false;
  if (reportFilter !== 'all' && !(REPORT_FILTERS[reportFilter] || []).includes(reportPeriod)) return false;

  if (mode === 'full' && reportType !== 'full') return false;
  if (mode === 'summary' && reportType !== 'summary') return false;

  if (stockQuery) {
    const primary = getPrimaryCode(item);
    const haystack = [
      title,
      category,
      primary?.stock_code || '',
      primary?.short_name || '',
    ]
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(String(stockQuery).trim().toLowerCase())) return false;
  }

  return true;
}

async function resolveStockCode(keyword) {
  const value = normalizeText(keyword);
  if (!value) return '';
  if (isStockCode(value)) return value;

  const url = new URL(SUGGEST_URL);
  url.searchParams.set('input', value);
  url.searchParams.set('type', '14');
  url.searchParams.set('count', '10');

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json',
    },
  });
  if (!resp.ok) {
    throw new CliError('HTTP_ERROR', `stock suggest failed: HTTP ${resp.status}`, url.toString());
  }

  const data = await resp.json();
  const items = Array.isArray(data?.QuotationCodeTable?.Data) ? data.QuotationCodeTable.Data : [];
  const best = items.find((item) => item?.Classify === 'AStock' && isStockCode(item?.Code)) || items[0];
  return isStockCode(best?.Code) ? best.Code : '';
}

async function fetchPage(pageIndex, pageSize, market, stockCode = '') {
  const url = new URL(API_URL);
  url.searchParams.set('page_size', String(pageSize));
  url.searchParams.set('page_index', String(pageIndex));
  url.searchParams.set('ann_type', stockCode ? 'A' : market);
  url.searchParams.set('client_source', 'web');
  url.searchParams.set('f_node', '0');
  url.searchParams.set('s_node', '0');
  if (stockCode) {
    url.searchParams.set('stock_list', stockCode);
  }

  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: 'application/json',
    },
  });

  if (!resp.ok) {
    throw new CliError('HTTP_ERROR', `report failed: HTTP ${resp.status}`, url.toString());
  }

  const data = await resp.json();
  return Array.isArray(data?.data?.list) ? data.data.list : [];
}

cli({
  site: 'eastmoney',
  name: 'report',
  description: '东方财富定期报告公告流（年报/半年报/中报/一季报/三季报）',
  domain: 'np-anotice-stock.eastmoney.com',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    { name: 'market', type: 'string', default: 'SHA,SZA,BJA', help: '交易所：SHA / SZA / BJA，可逗号分隔' },
    { name: 'year', type: 'string', default: '', help: '报告年份，如 2025；留空表示不过滤年份' },
    {
      name: 'stock',
      type: 'string',
      default: '',
      help: '股票代码、简称或关键词，如 300750 / 宁德时代',
    },
    {
      name: 'report',
      type: 'string',
      default: 'all',
      help: '报告类型：all / annual / semi / q1 / q3，支持 年报 / 中报 / 中期 / 一季报 / 三季报',
    },
    { name: 'mode', type: 'string', default: 'all', help: '公告类型：all / full / summary' },
    { name: 'limit', type: 'int', default: 20, help: '返回条数 (max 100)' },
    { name: 'scanPages', type: 'int', default: 10, help: '向后扫描的公告页数，默认 10' },
  ],
  columns: [
    'time',
    'reportYear',
    'reportPeriod',
    'reportType',
    'code',
    'name',
    'title',
    'category',
    'url',
  ],
  func: async (_page, args) => {
    const market = normalizeText(args.market) || 'SHA,SZA,BJA';
    const year = normalizeText(args.year);
    const stock = normalizeText(args.stock);
    const reportFilter = resolveReportFilter(args.report);
    const mode = resolveMode(args.mode);
    const limit = Math.max(1, Math.min(Number(args.limit) || 20, 100));
    const scanPages = Math.max(1, Math.min(Number(args.scanPages) || 10, 50));
    const stockCode = isStockCode(stock) ? stock : stock ? await resolveStockCode(stock) : '';
    const filterStockQuery = stockCode ? '' : stock;

    const matched = [];

    for (let pageIndex = 1; pageIndex <= scanPages && matched.length < limit; pageIndex += 1) {
      const list = await fetchPage(pageIndex, 100, market, stockCode);
      if (list.length === 0) break;

      for (const item of list) {
        if (!matchesReport(item, year, reportFilter, mode, filterStockQuery)) continue;
        matched.push(item);
        if (matched.length >= limit) break;
      }
    }

    if (matched.length === 0) {
      throw new CliError(
        'NO_DATA',
        `eastmoney returned no report data for market=${market}, year=${year || 'all'}, report=${reportFilter}, mode=${mode}, stock=${stock || 'none'}, stockCode=${stockCode || 'none'}`,
      );
    }

    return matched.slice(0, limit).map((item) => {
      const primary = getPrimaryCode(item);
      const title = normalizeText(item?.title || item?.title_ch);
      const category = getCategory(item);
      return {
        time: normalizeText(item?.notice_date || item?.display_time).slice(0, 19),
        reportYear: extractReportYear(title),
        reportPeriod: getReportPeriod(title, category),
        reportType: getReportType(title, category),
        code: normalizeText(primary?.stock_code),
        name: normalizeText(primary?.short_name),
        title,
        category,
        url: buildDetailUrl(primary?.stock_code, item?.art_code),
      };
    });
  },
});
