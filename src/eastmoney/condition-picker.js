import { cli, Strategy } from '@jackwener/opencli/registry';
import { CliError } from '@jackwener/opencli/errors';

const DEFAULT_QUERY = '最新股息率>5%;';
const RESULT_URL = 'https://xuangu.eastmoney.com/Result?a=edit_way&id=';
const SEARCH_URL = 'https://np-tjxg-b.eastmoney.com/api/smart-tag/stock/v3/pw/search-code';

function makeRequestId() {
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
    .replace(/\./g, '')
    .slice(0, 32);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeQuery(value) {
  const query = normalizeText(value).replace(/\s*\n+\s*/g, ';');
  if (!query) return '';
  return /[;；]\s*$/.test(query) ? query : `${query};`;
}

async function fetchJson(url, init = {}) {
  const resp = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0',
      ...(init.headers || {}),
    },
  });

  if (!resp.ok) {
    throw new CliError('HTTP_ERROR', `Eastmoney request failed: HTTP ${resp.status}`, url);
  }

  return resp.json();
}

function buildSearchPayload({ page, pageSize, query }) {
  const keyWord = normalizeQuery(query || DEFAULT_QUERY);
  return {
    keyWord,
    pageSize,
    pageNo: page,
    fingerprint: makeRequestId(),
    matchWord: '',
    shareToGuba: false,
    timestamp: Date.now(),
    requestId: makeRequestId(),
    removedConditionIdList: [],
    ownSelectAll: false,
    needCorrect: false,
    client: 'web',
    needShowStockNum: false,
    biz: 'web_ai_select_stocks',
  };
}

function cleanColumnTitle(column) {
  return normalizeText(column?.title).replace(/\(.*?\)/g, '').trim();
}

function pickConditionColumn(columns) {
  return (
    columns.find((col) => col?.userNeed === 1 && col?.key && col.key !== 'SERIAL') ||
    columns.find((col) => col?.sortWay && col?.key && col.key !== 'SERIAL') ||
    null
  );
}

function rowValue(row, key) {
  return key ? row?.[key] ?? '' : '';
}

function compactJson(value) {
  return JSON.stringify(value || [], null, 0);
}

function buildMetricEntries(columns, row) {
  return columns
    .filter((column) => column?.key && column.key !== 'SERIAL')
    .map((column) => ({
      key: column.key,
      title: normalizeText(column.title),
      shortTitle: cleanColumnTitle(column),
      value: rowValue(row, column.key),
      unit: normalizeText(column.unit),
      date: normalizeText(column.dateMsg),
      dataType: normalizeText(column.dataType),
      sortable: Boolean(column.sortable),
      sortWay: normalizeText(column.sortWay),
      userNeed: column?.userNeed === 1,
      redGreenAble: Boolean(column.redGreenAble),
    }));
}

function flattenTraceInfo(traceInfo) {
  if (!traceInfo) return [];
  const list = [];
  const queue = [traceInfo];
  while (queue.length > 0) {
    const item = queue.shift();
    list.push({
      conditionId: item?.conditionId ?? null,
      showText: normalizeText(item?.showText),
      traceText: normalizeText(item?.traceText),
      etext: normalizeText(item?.etext),
      dtext: normalizeText(item?.dtext),
    });
    if (Array.isArray(item?.childrenInfo)) queue.push(...item.childrenInfo);
  }
  return list.filter((item) => item.showText || item.traceText || item.etext || item.dtext);
}

function buildConditionText(data, fallback) {
  return (
    normalizeQuery(data?.traceInfo?.traceText) ||
    normalizeText(data?.traceInfo?.etext) ||
    normalizeQuery(data?.responseConditionList?.map((item) => item?.describe).filter(Boolean).join(' 且 ')) ||
    normalizeQuery(fallback)
  );
}

async function searchStock(payload) {
  const data = await fetchJson(SEARCH_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (data?.code !== '100' || !data?.data?.result) {
    throw new CliError('NO_DATA', 'Eastmoney returned no condition-picker result', data?.msg);
  }

  return data.data;
}

cli({
  site: 'eastmoney',
  name: 'condition-picker',
  description: '东方财富完整条件选股',
  domain: 'np-tjxg-b.eastmoney.com',
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    {
      name: 'query',
      type: 'string',
      default: DEFAULT_QUERY,
      help: '条件文本，如 "roe>15%;市值>100亿;"',
    },
    { name: 'page', type: 'int', default: 1, help: '页码，默认 1' },
    { name: 'pageSize', type: 'int', default: 50, help: '每页条数，默认 50，最大 100' },
  ],
  columns: [
    'rank',
    'code',
    'name',
    'market',
    'price',
    'changePercent',
    'conditionField',
    'conditionValue',
    'turnoverRate',
    'volume',
    'amount',
    'peDynamic',
    'pb',
    'totalMarketValue',
    'circulationMarketValue',
    'conditionText',
    'resolvedConditionText',
    'matchedConditions',
    'userNeededMetrics',
    'allMetrics',
    'total',
    'resultUrl',
    'xcId',
  ],
  func: async (_page, args) => {
    const page = Math.max(1, Number(args.page) || 1);
    const pageSize = Math.max(1, Math.min(Number(args.pageSize) || 50, 100));
    const query = normalizeQuery(args.query);
    if (!query) {
      throw new CliError('INVALID_ARGUMENT', 'Pass a non-empty --query condition.');
    }

    const payload = buildSearchPayload({
      page,
      pageSize,
      query,
    });
    const data = await searchStock(payload);
    const result = data.result;
    const columns = Array.isArray(result?.columns) ? result.columns : [];
    const rows = Array.isArray(result?.dataList) ? result.dataList : [];
    const total = Number(result?.total) || rows.length;
    const effectiveXcId = normalizeText(data?.xcId);

    if (rows.length === 0) {
      throw new CliError(
        'NO_DATA',
        `Eastmoney condition-picker returned empty result for ${payload.keyWord}`,
      );
    }

    const conditionColumn = pickConditionColumn(columns);
    const resolvedConditionText = buildConditionText(data, payload.keyWord);
    const matchedConditions = compactJson(flattenTraceInfo(data?.traceInfo));
    const offset = (page - 1) * pageSize;

    return rows.map((row, index) => {
      const metricEntries = buildMetricEntries(columns, row);
      const selectedMetrics = metricEntries.filter((item) => item.userNeed);
      return {
        rank: offset + index + 1,
        code: row.SECURITY_CODE || '',
        name: row.SECURITY_SHORT_NAME || '',
        market: row.MARKET_SHORT_NAME || '',
        price: row.NEWEST_PRICE || '',
        changePercent: row.CHG || '',
        conditionField: conditionColumn?.title || '',
        conditionValue: rowValue(row, conditionColumn?.key),
        turnoverRate: row.TURNOVER_RATE || '',
        volume: row.VOLUME || '',
        amount: row.TRADING_VOLUMES || '',
        peDynamic: row.PE_DYNAMIC || '',
        pb: row.PB || '',
        totalMarketValue: row['TOAL_MARKET_VALUE<140>'] || row.TOAL_MARKET_VALUE || '',
        circulationMarketValue: row['CIRCULATION_MARKET_VALUE<140>'] || row.CIRCULATION_MARKET_VALUE || '',
        conditionText: payload.keyWord,
        resolvedConditionText,
        matchedConditions,
        userNeededMetrics: compactJson(selectedMetrics),
        allMetrics: compactJson(metricEntries),
        total,
        resultUrl: effectiveXcId ? `${RESULT_URL}${effectiveXcId}` : '',
        xcId: effectiveXcId,
      };
    });
  },
});
