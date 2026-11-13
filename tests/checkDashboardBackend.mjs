import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';

// Live backend check, without fixtures. Credentials stay in process memory.
const base = (process.env.DASHBOARD_BACKEND_URL || 'https://api.influencermatch.site/api/v1').replace(/\/$/, '');
const token = process.env.DATA_MANAGER_ACCESS_TOKEN;
if (!token) {
  console.error('Cần DATA_MANAGER_ACCESS_TOKEN để kiểm tra backend thật. Không ghi token vào source hoặc file log.');
  process.exit(2);
}

async function get(endpoint, config = {}) {
  const url = new URL(base + endpoint);
  for (const [key, value] of Object.entries(config.params || {})) url.searchParams.set(key, String(value));
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(60000) });
  console.log(`${response.status} GET ${url.pathname}${url.search}`);
  if (!response.ok) throw new Error(`Backend trả HTTP ${response.status} cho ${endpoint}`);
  return { data: await response.json() };
}

try {
  const me = await get('/auth/me');
  const role = (me.data.data ?? me.data).role;
  if (role !== 'DATA_MANAGER') throw new Error('Cần kiểm tra bằng tài khoản DATA_MANAGER.');
  console.log('Authenticated role: DATA_MANAGER');

  // Execute the same mapper used by the application with a real HTTP client.
  const context = vm.createContext({ console, Date });
  const client = new vm.SyntheticModule(['default'], function () { this.setExport('default', { get }); }, { context });
  const uncachedQueries = new vm.SyntheticModule(['createDataManagerQuery'], function () {
    this.setExport('createDataManagerQuery', (_key, load) => load);
  }, { context });
  const source = stripTypeScriptTypes(await readFile(new URL('../src/services/api/dataManagerDashboardService.ts', import.meta.url), 'utf8'));
  const module = new vm.SourceTextModule(source, { context });
  await module.link(specifier => {
    if (specifier === '../dataManagerCache') return uncachedQueries;
    if (specifier !== '../apiClient') throw new Error('Unexpected dependency');
    return client;
  });
  await module.evaluate();
  const api = module.namespace.dataManagerDashboardService;
  const summary = await api.getCreatorMasterSummary();
  console.log('Summary mapped:', JSON.stringify(summary));
  const niches = await api.getNicheStatistics();
  console.log('Niche statistics mapped:', niches.length, 'rows');
  const catalog = await get('/data/niches');
  if (!Array.isArray(catalog.data.data)) throw new Error('Danh mục ngành hàng không hợp lệ.');
  console.log('Niche catalog:', catalog.data.data.length, 'rows');
  for (const days of [7, 30]) {
    const trends = await api.getCrawlerTrends(days);
    console.log('Trends mapped:', JSON.stringify({ days, rows: trends.items.length, source: trends.source, isFallback: trends.isFallback }));
  }
  console.log('Live Data Manager API checks passed. Empty/zero responses are retained as returned by the backend.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Live backend check failed.');
  process.exitCode = 1;
}
