/*
 * 运行状态看板
 * 实时探测 Vercel 上的应用与 Supabase 项目，并汇总 Vercel / Supabase 官方状态页。
 * 纯前端、无依赖：配置与历史记录保存在浏览器 localStorage。
 */
(() => {
  'use strict';

  const CONFIG_KEY = 'status-monitor.config.v1';
  const HISTORY_KEY = 'status-monitor.history.v1';
  const INTERVALS = [3000, 5000, 10000, 30000, 60000];
  const PROBE_TIMEOUT_MS = 8000;
  const SLOW_MS = 1200;
  const MAX_SAMPLES = 40;
  const PLATFORM_REFRESH_MS = 60000;
  const HISTORY_TTL_MS = 24 * 60 * 60 * 1000;
  const MAX_EVENTS = 80;

  const STATUS_TEXT = {
    operational: '运行正常',
    degraded: '性能降级',
    down: '服务故障',
    paused: '已停止',
    unknown: '等待检测',
  };

  const STATUS_MARK = {
    operational:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M8 12.4l2.7 2.7L16.4 9"/></svg>',
    degraded:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M12 7.6v5.2"/><path d="M12 16.4h.01"/></svg>',
    down:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
    unknown:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M12 8.2v4.4"/><path d="M12 15.9h.01"/></svg>',
  };

  const PLATFORMS = {
    vercel: {
      name: 'Vercel',
      letter: 'V',
      page: 'https://www.vercel-status.com',
      summary: 'https://www.vercel-status.com/api/v2/summary.json',
      incidents: 'https://www.vercel-status.com/api/v2/incidents.json',
      components: null,
    },
    supabase: {
      name: 'Supabase',
      letter: 'S',
      page: 'https://status.supabase.com',
      summary: 'https://status.supabase.com/api/v2/summary.json',
      incidents: 'https://status.supabase.com/api/v2/incidents.json',
      components: 'https://status.supabase.com/api/v2/components.json',
    },
  };

  const DEFAULT_CONFIG = {
    intervalMs: 5000,
    vercelToken: '',
    vercelTeam: '',
    apps: [
      {
        id: 'presentations',
        name: 'Presentations',
        url: '',
        kind: 'web',
        note: '',
        vercelProjectId: '',
        stopped: false,
      },
    ],
  };

  // ---------------------------------------------------------------- utils

  const $ = (selector, root = document) => root.querySelector(selector);

  function h(tag, props, ...children) {
    const node = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value == null || value === false) continue;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'html') node.innerHTML = value;
        else if (key === 'dataset') Object.assign(node.dataset, value);
        else if (key === 'style') Object.assign(node.style, value);
        else if (key.startsWith('on') && typeof value === 'function') {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else node.setAttribute(key, value === true ? '' : String(value));
      }
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  const svgNS = 'http://www.w3.org/2000/svg';

  function svg(tag, attrs) {
    const node = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, String(value));
    return node;
  }

  const pad2 = (n) => String(n).padStart(2, '0');

  function clockTime(ts) {
    const d = new Date(ts);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  }

  function dayLabel(ts) {
    const d = new Date(ts);
    return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function duration(ms) {
    if (ms == null) return '';
    return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
  }

  function percent(value) {
    if (value == null) return null;
    const pct = value * 100;
    if (pct >= 99.995) return '100%';
    return `${pct.toFixed(pct >= 99 ? 2 : 1)}%`;
  }

  // ---------------------------------------------------------------- config

  function loadConfig() {
    let stored = null;
    try {
      stored = JSON.parse(window.localStorage.getItem(CONFIG_KEY) || 'null');
    } catch {
      stored = null;
    }
    const config = {
      ...DEFAULT_CONFIG,
      ...(stored && typeof stored === 'object' ? stored : {}),
    };
    if (!Array.isArray(config.apps)) config.apps = DEFAULT_CONFIG.apps.slice();
    config.apps = config.apps
      .filter((app) => app && typeof app === 'object' && typeof app.name === 'string')
      .map((app) => ({
        id: String(app.id || `app-${Math.random().toString(36).slice(2, 8)}`),
        name: app.name,
        url: typeof app.url === 'string' ? app.url : '',
        kind: app.kind === 'supabase' ? 'supabase' : 'web',
        note: typeof app.note === 'string' ? app.note : '',
        vercelProjectId: typeof app.vercelProjectId === 'string' ? app.vercelProjectId : '',
        stopped: Boolean(app.stopped),
      }));
    if (!Number.isFinite(config.intervalMs) || !INTERVALS.includes(config.intervalMs)) {
      config.intervalMs = DEFAULT_CONFIG.intervalMs;
    }
    return config;
  }

  function saveConfig() {
    try {
      window.localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config));
    } catch {
      /* storage may be unavailable; the page still works for this session */
    }
  }

  function loadHistory() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(HISTORY_KEY) || 'null');
      return stored && typeof stored === 'object' ? stored : {};
    } catch {
      return {};
    }
  }

  let historySaveTimer = null;

  function saveHistorySoon() {
    clearTimeout(historySaveTimer);
    historySaveTimer = setTimeout(() => {
      try {
        window.localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
      } catch {
        /* ignore quota / private mode errors */
      }
    }, 4000);
  }

  function saveHistoryNow() {
    clearTimeout(historySaveTimer);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history));
    } catch {
      /* ignore */
    }
  }

  // ---------------------------------------------------------------- state

  const state = {
    config: loadConfig(),
    history: loadHistory(),
    runtime: new Map(),
    running: true,
    timer: null,
    nextAt: 0,
    lastCheckAt: 0,
    platforms: {},
    events: [],
    appNodes: new Map(),
    renderedAppIds: '',
  };

  function runtimeFor(appId) {
    if (!state.runtime.has(appId)) {
      state.runtime.set(appId, {
        status: 'unknown',
        ms: null,
        code: null,
        error: '',
        samples: [],
        lastAt: 0,
        pausedAt: 0,
      });
    }
    return state.runtime.get(appId);
  }

  function eventLog(level, message) {
    state.events.unshift({ at: Date.now(), level, message });
    if (state.events.length > MAX_EVENTS) state.events.length = MAX_EVENTS;
    renderEvents();
  }

  let toastTimer = null;

  function toast(message, level = 'info') {
    const node = $('#toast');
    node.textContent = message;
    node.dataset.level = level;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      node.hidden = true;
    }, 4200);
  }

  // ---------------------------------------------------------------- probing

  function rootUrl() {
    try {
      return new URL('../', window.location.href).href;
    } catch {
      return '';
    }
  }

  function appUrl(app) {
    const raw = (app.url || '').trim();
    if (raw) return raw;
    return rootUrl();
  }

  function probeTarget(app) {
    const base = appUrl(app);
    if (!base) return null;
    if (app.kind === 'supabase') return `${base.replace(/\/+$/, '')}/auth/v1/health`;
    return base;
  }

  async function probe(app) {
    const target = probeTarget(app);
    if (!target) return { ok: false, ms: 0, code: null, error: '未配置 URL' };

    const started = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      const origin = new URL(target, window.location.href).origin;
      const readBody = origin === window.location.origin || app.kind === 'supabase';
      const response = await fetch(target, {
        method: 'GET',
        mode: readBody ? 'cors' : 'no-cors',
        cache: 'no-store',
        redirect: 'follow',
        signal: controller.signal,
      });
      const ms = Math.round(performance.now() - started);
      if (readBody) {
        return { ok: response.ok, ms, code: response.status, error: response.ok ? '' : `HTTP ${response.status}` };
      }
      // Cross-origin opaque responses only tell us that the host answered.
      return { ok: true, ms, code: null, error: '' };
    } catch (error) {
      const ms = Math.round(performance.now() - started);
      const timeout = error && error.name === 'AbortError';
      return { ok: false, ms, code: null, error: timeout ? '请求超时' : '无法连接' };
    } finally {
      clearTimeout(timer);
    }
  }

  function statusFor(result, app) {
    if (app.stopped) return 'paused';
    if (!result) return 'unknown';
    if (!result.ok) return 'down';
    return result.ms > SLOW_MS ? 'degraded' : 'operational';
  }

  function recordSample(appId, result) {
    const minute = Math.floor(Date.now() / 60000) * 60000;
    const buckets = state.history[appId] || (state.history[appId] = {});
    const bucket = buckets[minute] || (buckets[minute] = { ok: 0, total: 0, ms: 0 });
    bucket.total += 1;
    if (result.ok) {
      bucket.ok += 1;
      bucket.ms += result.ms;
    }
    const cutoff = Date.now() - HISTORY_TTL_MS;
    for (const key of Object.keys(buckets)) {
      if (Number(key) < cutoff) delete buckets[key];
    }
    saveHistorySoon();
  }

  function uptimeFor(appId) {
    const buckets = state.history[appId];
    if (!buckets) return null;
    let ok = 0;
    let total = 0;
    for (const bucket of Object.values(buckets)) {
      ok += bucket.ok;
      total += bucket.total;
    }
    return total >= 1 ? ok / total : null;
  }

  function averageLatency() {
    let sum = 0;
    let count = 0;
    for (const app of state.config.apps) {
      const rt = state.runtime.get(app.id);
      if (!rt || app.stopped || rt.ms == null) continue;
      sum += rt.ms;
      count += 1;
    }
    return count ? sum / count : null;
  }

  async function checkApp(app) {
    const rt = runtimeFor(app.id);
    if (app.stopped) {
      rt.status = 'paused';
      return;
    }
    if (document.hidden) return;
    const result = await probe(app);
    const nextStatus = statusFor(result, app);
    const before = rt.status;
    rt.status = nextStatus;
    rt.ms = result.ok ? result.ms : null;
    rt.code = result.code;
    rt.error = result.error || '';
    // The first probe of a session includes connection setup; keep it out of the chart.
    const warmup = rt.lastAt === 0;
    rt.lastAt = Date.now();
    if (!warmup) {
      rt.samples.push({ t: rt.lastAt, ms: result.ok ? result.ms : null, ok: result.ok });
      if (rt.samples.length > MAX_SAMPLES) rt.samples.shift();
    }
    recordSample(app.id, result);

    if (before !== nextStatus) {
      if (nextStatus === 'down') {
        eventLog('error', `${app.name} 无法访问${rt.error ? `（${rt.error}）` : ''}`);
      } else if (nextStatus === 'degraded') {
        eventLog('warn', `${app.name} 响应变慢：${duration(rt.ms)}`);
      } else if (nextStatus === 'operational') {
        eventLog('ok', `${app.name} 运行正常${rt.ms != null ? `（${duration(rt.ms)}）` : ''}`);
      }
    }
  }

  // ---------------------------------------------------------------- loop

  async function tick() {
    if (!state.running) return;
    clearTimeout(state.timer);
    if (document.hidden) {
      schedule();
      return;
    }
    const apps = state.config.apps.filter((app) => !app.stopped);
    await Promise.all(apps.map((app) => checkApp(app)));
    state.lastCheckAt = Date.now();
    render();
    schedule();
  }

  function schedule() {
    clearTimeout(state.timer);
    if (!state.running) return;
    state.nextAt = Date.now() + state.config.intervalMs;
    state.timer = setTimeout(tick, state.config.intervalMs);
  }

  function startMonitoring({ silent = false } = {}) {
    if (state.running && state.timer) return;
    state.running = true;
    document.body.dataset.monitoring = 'running';
    setLiveLabel();
    if (!silent) eventLog('info', '已开始实时监控');
    tick();
    refreshPlatforms();
  }

  function stopMonitoring({ silent = false } = {}) {
    if (!state.running) return;
    state.running = false;
    clearTimeout(state.timer);
    state.timer = null;
    state.nextAt = 0;
    document.body.dataset.monitoring = 'paused';
    setLiveLabel();
    render();
    if (!silent) eventLog('info', '已暂停实时监控');
  }

  function setLiveLabel() {
    const pill = $('#livePill');
    const label = $('#liveLabel');
    pill.dataset.state = state.running ? 'running' : 'paused';
    if (!state.running) {
      label.textContent = '监控已暂停';
      return;
    }
    const remaining = Math.max(0, Math.ceil((state.nextAt - Date.now()) / 1000));
    label.textContent = remaining > 0 ? `实时监控中 · ${remaining}s` : '实时监控中';
  }

  // ---------------------------------------------------------------- platforms

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-store', mode: 'cors' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function mapPlatformStatus(value) {
    switch (value) {
      case 'operational':
        return 'operational';
      case 'degraded_performance':
      case 'under_maintenance':
      case 'maintenance':
        return 'degraded';
      case 'partial_outage':
      case 'major_outage':
        return 'down';
      default:
        return 'unknown';
    }
  }

  function mapIndicator(indicator) {
    switch (indicator) {
      case 'none':
        return 'operational';
      case 'minor':
        return 'degraded';
      case 'major':
      case 'critical':
        return 'down';
      default:
        return 'unknown';
    }
  }

  function platformStatusText(status) {
    return (
      {
        operational: '运行正常',
        degraded: '部分降级',
        down: '服务故障',
        unknown: '状态未知',
      }[status] || '状态未知'
    );
  }

  async function refreshPlatform(key) {
    const meta = PLATFORMS[key];
    try {
      const requests = [fetchJson(meta.summary), fetchJson(meta.incidents).catch(() => null)];
      if (meta.components) requests.push(fetchJson(meta.components).catch(() => null));
      const [summary, incidentsPayload, componentsPayload] = await Promise.all(requests);
      const components = (componentsPayload && componentsPayload.components) || summary.components || [];
      const incidents = (incidentsPayload && incidentsPayload.incidents) || summary.incidents || [];
      const status = mapIndicator(summary && summary.status ? summary.status.indicator : 'none');

      const groups = buildGroups(key, components);
      const affected = groups.filter((group) => group.status === 'down' || group.status === 'degraded').length;
      const previous = state.platforms[key];
      state.platforms[key] = {
        ok: true,
        status,
        description: (summary && summary.status && summary.status.description) || platformStatusText(status),
        groups,
        affected,
        incidents: incidents.slice(0, 4),
        history: buildHistoryBars(incidents, 60),
        updatedAt: Date.now(),
        error: '',
      };
      if (previous && previous.ok && previous.status !== status) {
        if (status === 'operational') {
          eventLog('ok', `${meta.name} 平台恢复正常`);
        } else if (status === 'degraded') {
          eventLog('warn', `${meta.name} 平台部分降级`);
        } else if (status === 'down') {
          eventLog('error', `${meta.name} 平台出现故障`);
        }
      }
    } catch (error) {
      state.platforms[key] = {
        ok: false,
        status: 'unknown',
        description: '状态页暂不可用',
        groups: [],
        affected: 0,
        incidents: [],
        history: [],
        updatedAt: Date.now(),
        error: error && error.message ? error.message : '请求失败',
      };
    }
    renderPlatforms();
    renderHero();
  }

  function buildGroups(key, components) {
    const mapStatus = (value) => mapPlatformStatus(value);
    if (key === 'vercel') {
      const groups = components.filter((component) => component.group);
      const children = components.filter((component) => !component.group);
      return groups.map((group) => {
        const members = children.filter((component) => component.group_id === group.id);
        const status = members.reduce(
          (worst, member) => worseStatus(worst, mapStatus(member.status)),
          members.length ? 'operational' : 'unknown'
        );
        return { name: group.name, status, detail: `${members.length} 个组件` };
      }).concat(
        children
          .filter((component) => !component.group_id)
          .map((component) => ({ name: component.name, status: mapStatus(component.status), detail: '' }))
      );
    }
    // Supabase: components are regions; surface the affected ones first.
    const rank = { unknown: 0, operational: 1, degraded: 2, down: 3 };
    return [...components]
      .map((component) => ({ name: component.name, status: mapStatus(component.status), detail: '' }))
      .sort((a, b) => (rank[b.status] || 0) - (rank[a.status] || 0));
  }

  const STATUS_RANK = { unknown: 0, operational: 1, degraded: 2, down: 3 };

  function worseStatus(a, b) {
    return (STATUS_RANK[b] || 0) > (STATUS_RANK[a] || 0) ? b : a;
  }

  function buildHistoryBars(incidents, days) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bars = [];
    for (let offset = days - 1; offset >= 0; offset -= 1) {
      const start = today.getTime() - offset * 86400000;
      const end = start + 86400000;
      let level = 'ok';
      for (const incident of incidents) {
        const created = Date.parse(incident.created_at || '');
        const resolved = Date.parse(incident.resolved_at || incident.updated_at || '') || end;
        if (!Number.isFinite(created)) continue;
        if (created < end && resolved > start) {
          if (incident.impact === 'critical' || incident.impact === 'major') level = 'down';
          else if (level !== 'down') level = 'degraded';
        }
      }
      bars.push({ at: start, level });
    }
    return bars;
  }

  async function refreshPlatforms() {
    if (!state.running) return;
    await Promise.all(Object.keys(PLATFORMS).map((key) => refreshPlatform(key)));
  }

  // ---------------------------------------------------------------- render

  function overallStatus() {
    let worst = 'unknown';
    let known = false;
    for (const app of state.config.apps) {
      const rt = state.runtime.get(app.id);
      if (!rt) continue;
      const status = app.stopped ? 'paused' : rt.status;
      if (status === 'unknown' || status === 'paused') continue;
      known = true;
      worst = worseStatus(worst, status);
    }
    for (const platform of Object.values(state.platforms)) {
      if (!platform || !platform.ok) continue;
      known = true;
      worst = worseStatus(worst, platform.status);
    }
    return known ? (worst === 'unknown' ? 'operational' : worst) : 'unknown';
  }

  function renderHero() {
    const status = overallStatus();
    const hero = $('#hero');
    hero.dataset.status = status;
    $('#overallTitle').innerHTML = `<span class="status-mark">${STATUS_MARK[status] || STATUS_MARK.unknown}</span>`;
    $('#overallTitle').append(
      document.createTextNode(
        {
          operational: '所有系统运行正常',
          degraded: '部分服务降级',
          down: '检测到服务故障',
          unknown: '正在检测…',
        }[status] || '正在检测…'
      )
    );

    const apps = state.config.apps;
    const active = apps.filter((app) => !app.stopped);
    const up = active.filter((app) => {
      const rt = state.runtime.get(app.id);
      return rt && rt.status === 'operational';
    }).length;

    const avg = averageLatency();
    $('#statApps').textContent = active.length ? `${up}/${active.length}` : '—';
    $('#statLatency').textContent = avg == null ? '—' : duration(avg);

    let ok = 0;
    let total = 0;
    for (const app of apps) {
      const buckets = state.history[app.id];
      if (!buckets) continue;
      for (const bucket of Object.values(buckets)) {
        ok += bucket.ok;
        total += bucket.total;
      }
    }
    const rate = total >= 1 ? ok / total : null;
    $('#statUptime').textContent = percent(rate) || '—';
    $('#statChecked').textContent = state.lastCheckAt ? clockTime(state.lastCheckAt) : '—';
    $('#intervalNote').textContent = String(Math.round(state.config.intervalMs / 1000));
    $('#overallLead').textContent = state.running
      ? `Vercel 应用与 Supabase 服务 · 每 ${Math.round(state.config.intervalMs / 1000)} 秒检查一次`
      : '监控已暂停 · 点击「开始监控」继续实时检测';
  }

  function kindLabel(app) {
    if (app.kind === 'supabase') return 'supabase';
    if (app.vercelProjectId) return 'vercel';
    return 'web';
  }

  function isCrossOrigin(app) {
    try {
      return new URL(appUrl(app), window.location.href).origin !== window.location.origin;
    } catch {
      return true;
    }
  }

  function renderApps() {
    const ids = state.config.apps.map((app) => app.id).join('|');
    if (ids !== state.renderedAppIds) {
      state.renderedAppIds = ids;
      state.appNodes.clear();
      const cards = state.config.apps.map((app) => buildAppCard(app));
      $('#appGrid').replaceChildren(...cards);
    }
    for (const app of state.config.apps) updateAppCard(app);
    $('#appsEmpty').hidden = state.config.apps.length > 0;
  }

  function buildAppCard(app) {
    const rt = runtimeFor(app.id);
    const pill = h('span', { class: 'pill' }, STATUS_TEXT[rt.status]);
    const latency = h('span', { class: 'latency is-empty' }, '—');
    const gridTop = svg('line', { class: 'grid', x1: 0, y1: 12, x2: 152, y2: 12 });
    const gridBottom = svg('line', { class: 'grid', x1: 0, y1: 26, x2: 152, y2: 26 });
    const area = svg('path', { class: 'area', d: '' });
    const line = svg('path', { class: 'line', d: '' });
    const spark = svg('svg', {
      class: 'spark',
      viewBox: '0 0 152 38',
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
    });
    spark.append(gridTop, gridBottom, area, line);

    const uptimeNode = h('b', null, '—');
    const updatedNode = h('span', { class: 'updated' }, '—');
    const control = h('button', { class: 'btn btn-sm btn-danger', type: 'button' });
    const open = h(
      'a',
      {
        class: 'btn btn-sm btn-ghost',
        href: appUrl(app) || '#',
        target: '_blank',
        rel: 'noreferrer noopener',
      },
      '打开'
    );

    control.addEventListener('click', () => handleControl(app));

    const url = appUrl(app) || '未配置 URL';
    const card = h(
      'article',
      { class: 'app-card card', dataset: { status: rt.status }, 'aria-label': app.name },
      h(
        'div',
        { class: 'app-head' },
        h('span', { class: 'dot', 'aria-hidden': 'true' }),
        h(
          'div',
          { class: 'app-title' },
          h('h3', null, app.name, h('span', { class: 'app-kind' }, kindLabel(app))),
          h('p', { class: 'app-url' }, h('a', { href: url, target: '_blank', rel: 'noreferrer noopener' }, url))
        ),
        pill
      ),
      h('div', { class: 'metrics' }, latency, spark),
      h(
        'p',
        { class: 'app-meta' },
        h('span', null, '在线率 ', uptimeNode),
        h('span', null, '探测 ', h('b', { class: 'code' }, '—')),
        h('span', { class: 'hint' }, '')
      ),
      h('div', { class: 'app-foot' }, updatedNode, h('div', { class: 'actions' }, open, control))
    );

    state.appNodes.set(app.id, {
      card,
      pill,
      latency,
      spark,
      area,
      line,
      uptime: uptimeNode,
      updated: updatedNode,
      control,
      code: $('.code', card),
      hint: $('.hint', card),
    });
    return card;
  }

  function updateAppCard(app) {
    const node = state.appNodes.get(app.id);
    if (!node) return;
    const rt = runtimeFor(app.id);
    const status = app.stopped ? 'paused' : rt.status;
    node.card.dataset.status = status;
    node.pill.textContent = STATUS_TEXT[status] || STATUS_TEXT.unknown;

    if (app.stopped) {
      node.latency.className = 'latency is-empty';
      node.latency.textContent = '已停止';
    } else if (status === 'down') {
      node.latency.className = 'latency is-empty';
      node.latency.textContent = '无法访问';
    } else if (rt.ms == null) {
      node.latency.className = 'latency is-empty';
      node.latency.textContent = '等待检测';
    } else {
      node.latency.className = 'latency';
      node.latency.replaceChildren(
        document.createTextNode(String(Math.round(rt.ms))),
        h('span', { class: 'unit' }, 'ms')
      );
    }

    node.code.textContent = rt.code ? `HTTP ${rt.code}` : rt.ok ? '可达' : '不可达';
    node.hint.textContent = rt.error || (isCrossOrigin(app) ? '跨域探测' : '');
    const rate = uptimeFor(app.id);
    node.uptime.textContent = percent(rate) || '—';
    node.updated.textContent = rt.lastAt ? `最后检查 ${clockTime(rt.lastAt)}` : '尚未检查';

    const pending = Boolean(pendingControl && pendingControl.appId === app.id);
    node.control.textContent = pending ? '再次点击确认' : app.stopped ? '启动服务' : '停止服务';
    node.control.className = app.stopped ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-danger';
    node.control.disabled = Boolean(rt.busy);

    const samples = rt.samples;
    const width = 152;
    const height = 38;
    const pad = 2;
    if (samples.length === 1) {
      const y = height / 2;
      node.line.setAttribute('d', `M${pad},${y} L${width - pad},${y}`);
      node.area.setAttribute('d', '');
    } else if (samples.length > 1) {
      const values = samples.map((sample) => (sample.ok && sample.ms != null ? sample.ms : 0));
      const min = Math.min(...values);
      const max = Math.max(...values);
      const rawSpan = max - min;
      // Keep small latency jitter from filling the whole chart.
      const span = Math.max(rawSpan, max * 0.3, 1);
      const floor = min - (span - rawSpan) / 2;
      const points = samples.map((sample, index) => {
        const x = pad + (index / (samples.length - 1)) * (width - pad * 2);
        const value = sample.ok && sample.ms != null ? sample.ms : 0;
        const y = height - pad - ((value - floor) / span) * (height - pad * 2);
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      });
      node.line.setAttribute('d', points.join(' '));
      node.area.setAttribute(
        'd',
        `${points.join(' ')} L${width - pad},${height - pad} L${pad},${height - pad} Z`
      );
    } else {
      node.line.setAttribute('d', '');
      node.area.setAttribute('d', '');
    }
  }

  function renderPlatforms() {
    const grid = $('#platformGrid');
    const cards = [];
    for (const [key, meta] of Object.entries(PLATFORMS)) {
      cards.push(buildPlatformCard(key, meta, state.platforms[key]));
    }
    grid.replaceChildren(...cards);
    window.requestAnimationFrame(() => {
      grid.querySelectorAll('.components').forEach((list) => {
        if (list.scrollHeight > list.clientHeight + 2) {
          list.classList.add('is-scrollable');
          list.addEventListener('scroll', () => {
            const atEnd = list.scrollTop + list.clientHeight >= list.scrollHeight - 2;
            list.classList.toggle('at-end', atEnd);
          });
        }
      });
    });
  }

  function buildPlatformCard(key, meta, data) {
    const status = data && data.ok ? data.status : 'unknown';
    const bars = h('div', { class: 'bars', role: 'img', 'aria-label': '最近 60 天事件' });
    if (data && data.history && data.history.length) {
      for (const bar of data.history) {
        bars.append(
          h('span', {
            dataset: { level: bar.level },
            title: `${dayLabel(bar.at)} · ${
              { ok: '正常', degraded: '降级', down: '故障' }[bar.level] || '正常'
            }`,
          })
        );
      }
    } else {
      for (let i = 0; i < 60; i += 1) bars.append(h('span', { dataset: { level: 'none' } }));
    }

    const components = h('ul', { class: 'components' });
    const groups = (data && data.groups) || [];
    if (groups.length) {
      for (const group of groups) {
        components.append(
          h(
            'li',
            { dataset: { status: group.status }, title: `${group.name} · ${platformStatusText(group.status)}` },
            h('span', { class: 'dot', 'aria-hidden': 'true' }),
            h('span', { class: 'name' }, group.name),
            h(
              'span',
              { class: 'state' },
              `${platformStatusText(group.status)}${group.detail ? ` · ${group.detail}` : ''}`
            )
          )
        );
      }
    } else {
      components.append(
        h(
          'li',
          null,
          h('span', { class: 'state' }, data && data.ok ? '没有可展示的组件' : '状态页暂时无法读取')
        )
      );
    }

    const incidents = h('ul', { class: 'incidents' });
    const list = (data && data.incidents) || [];
    if (list.length) {
      for (const incident of list) {
        incidents.append(
          h(
            'li',
            null,
            h('span', { class: 'when' }, dayLabel(Date.parse(incident.created_at) || Date.now())),
            h('a', { href: incident.shortlink || `${meta.page}/incidents`, target: '_blank', rel: 'noreferrer noopener' }, incident.name)
          )
        );
      }
    } else {
      incidents.append(h('li', null, h('span', { class: 'when' }, '—'), h('span', null, '最近没有公开事件')));
    }

    return h(
      'article',
      { class: 'platform-card card', dataset: { status }, 'aria-label': meta.name },
      h(
        'div',
        { class: 'platform-head' },
        h('span', { class: 'logo', 'aria-hidden': 'true' }, meta.letter),
        h('div', null, h('h3', null, meta.name), h('p', null, data && data.ok ? data.description : '状态页暂不可用')),
        h('span', { class: 'pill' }, platformStatusText(status))
      ),
      bars,
      h(
        'div',
        { class: 'bars-legend' },
        h(
          'span',
          { class: 'bars-key' },
          h('i', { dataset: { level: 'ok' } }),
          '正常 ',
          h('i', { dataset: { level: 'degraded' } }),
          '降级 ',
          h('i', { dataset: { level: 'down' } }),
          '故障'
        ),
        h('span', null, data && data.updatedAt ? `更新于 ${clockTime(data.updatedAt)}` : '待刷新')
      ),
      components,
      incidents,
      h(
        'div',
        { class: 'platform-foot' },
        h('a', { href: meta.page, target: '_blank', rel: 'noreferrer noopener' }, '官方状态页 ↗'),
        h(
          'span',
          null,
          data && data.ok
            ? `${data.affected ? `${data.affected} 项异常` : '全部正常'} · 共 ${data.groups.length} 项`
            : data && data.error
              ? data.error
              : '待刷新'
        )
      )
    );
  }

  function renderEvents() {
    const list = $('#eventList');
    const items = state.events.map((event) =>
      h(
        'li',
        { dataset: { level: event.level } },
        h('time', { datetime: new Date(event.at).toISOString() }, clockTime(event.at)),
        h('span', { class: 'dot', 'aria-hidden': 'true' }),
        h('span', { class: 'msg' }, event.message)
      )
    );
    list.replaceChildren(...items);
    $('#eventsEmpty').hidden = items.length > 0;
  }

  function render() {
    renderHero();
    renderApps();
  }

  // ---------------------------------------------------------------- controls

  let pendingControl = null;

  function resetPendingControl() {
    if (!pendingControl) return;
    clearTimeout(pendingControl.timer);
    pendingControl = null;
    renderApps();
  }

  async function handleControl(app) {
    const node = state.appNodes.get(app.id);
    if (!node) return;
    const config = state.config;

    if (!config.vercelToken || !app.vercelProjectId) {
      toast('先在设置里填入 Vercel Token 和项目 ID，才能暂停 / 恢复真实项目', 'error');
      openSettings();
      $('#vercelToken').focus();
      return;
    }

    const action = app.stopped ? 'unpause' : 'pause';
    const pending = pendingControl && pendingControl.appId === app.id && pendingControl.action === action;
    if (!pending) {
      resetPendingControl();
      pendingControl = { appId: app.id, action, timer: null };
      pendingControl.timer = setTimeout(resetPendingControl, 5000);
      updateAppCard(app);
      return;
    }

    clearTimeout(pendingControl.timer);
    pendingControl = null;
    const rt = runtimeFor(app.id);
    rt.busy = true;
    node.control.disabled = true;
    node.control.textContent = action === 'pause' ? '正在停止…' : '正在启动…';

    try {
      await setProjectPaused(app, action === 'pause');
      app.stopped = action === 'pause';
      saveConfig();
      eventLog('info', `${app.name} 已${app.stopped ? '暂停' : '恢复'}（Vercel 项目 ${app.vercelProjectId}）`);
      toast(`${app.name} 已${app.stopped ? '暂停' : '恢复'}`, 'info');
      if (app.stopped) {
        rt.status = 'paused';
        rt.ms = null;
      } else {
        rt.status = 'unknown';
        rt.busy = false;
        updateAppCard(app);
        await checkApp(app);
      }
    } catch (error) {
      const message =
        error && error.message === 'missing-config' ? '缺少 Vercel Token 或项目 ID' : error.message || '请求失败';
      toast(`启停失败：${message}`, 'error');
      eventLog('error', `${app.name} 启停失败：${message}`);
    } finally {
      rt.busy = false;
    }
    updateAppCard(app);
    renderHero();
  }

  async function setProjectPaused(app, paused) {
    const config = state.config;
    if (!config.vercelToken || !app.vercelProjectId) throw new Error('missing-config');
    const url = new URL(
      `https://api.vercel.com/v1/projects/${encodeURIComponent(app.vercelProjectId)}/${paused ? 'pause' : 'unpause'}`
    );
    if (config.vercelTeam) url.searchParams.set('teamId', config.vercelTeam);
    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.vercelToken}` },
    });
    if (!response.ok) {
      let detail = '';
      try {
        const payload = await response.json();
        detail = payload && payload.error && payload.error.message ? payload.error.message : '';
      } catch {
        detail = '';
      }
      throw new Error(detail || `HTTP ${response.status}`);
    }
  }

  // ---------------------------------------------------------------- settings

  function fillIntervalSelects() {
    const options = INTERVALS.map((ms) =>
      h('option', { value: String(ms), selected: ms === state.config.intervalMs }, `${ms / 1000} 秒`)
    );
    $('#intervalSelect').replaceChildren(...options.map((node) => node.cloneNode(true)));
    $('#settingsInterval').replaceChildren(...options);
    $('#intervalSelect').value = String(state.config.intervalMs);
    $('#settingsInterval').value = String(state.config.intervalMs);
  }

  function onIntervalChange(ms) {
    state.config.intervalMs = Number(ms);
    saveConfig();
    fillIntervalSelects();
    renderHero();
    if (state.running) {
      eventLog('info', `刷新间隔改为 ${Number(ms) / 1000} 秒`);
      schedule();
    }
  }

  function openSettings() {
    const drawer = $('#settings');
    drawer.hidden = false;
    $('#scrim').hidden = false;
    document.body.style.overflow = 'hidden';
    $('#closeSettings').focus();
  }

  function closeSettings() {
    $('#settings').hidden = true;
    $('#scrim').hidden = true;
    document.body.style.overflow = '';
    $('#openSettings').focus();
  }

  function renderAppConfig() {
    const list = $('#appConfigList');
    if (!state.config.apps.length) {
      list.replaceChildren(h('li', null, h('span', { class: 'name' }, '还没有应用')));
      return;
    }
    list.replaceChildren(
      ...state.config.apps.map((app) =>
        h(
          'li',
          null,
          h(
            'span',
            { class: 'name' },
            app.name,
            h('small', null, app.url || rootUrl())
          ),
          h(
            'button',
            {
              class: 'btn btn-icon',
              type: 'button',
              'aria-label': `移除 ${app.name}`,
              onclick: () => removeApp(app.id),
            },
            '×'
          )
        )
      )
    );
  }

  function removeApp(appId) {
    state.config.apps = state.config.apps.filter((app) => app.id !== appId);
    state.runtime.delete(appId);
    delete state.history[appId];
    saveConfig();
    saveHistoryNow();
    renderAppConfig();
    renderApps();
    renderHero();
    eventLog('info', '已移除一个监控应用');
  }

  function addApp(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const url = String(data.get('url') || '').trim();
    const kind = String(data.get('kind') || 'web');
    const project = String(data.get('project') || '').trim();
    if (!name || !url) return;
    try {
      // Normalise and reject anything that is not http(s).
      const parsed = new URL(url);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error('protocol');
    } catch {
      toast('URL 需要以 http:// 或 https:// 开头', 'error');
      return;
    }
    state.config.apps.push({
      id: `app-${Date.now().toString(36)}`,
      name,
      url,
      kind: kind === 'supabase' ? 'supabase' : 'web',
      note: '',
      vercelProjectId: project,
      stopped: false,
    });
    saveConfig();
    form.reset();
    renderAppConfig();
    renderApps();
    renderHero();
    eventLog('info', `已添加监控应用：${name}`);
    toast(`已添加 ${name}`);
    checkApp(state.config.apps[state.config.apps.length - 1]).then(() => render());
  }

  // ---------------------------------------------------------------- boot

  function bindEvents() {
    $('#toggleMonitor').addEventListener('click', () => {
      if (state.running) {
        stopMonitoring();
        $('#toggleMonitor').textContent = '开始监控';
      } else {
        startMonitoring();
        $('#toggleMonitor').textContent = '暂停监控';
      }
    });

    $('#intervalSelect').addEventListener('change', (event) => onIntervalChange(event.target.value));
    $('#settingsInterval').addEventListener('change', (event) => onIntervalChange(event.target.value));

    $('#openSettings').addEventListener('click', openSettings);
    $('#closeSettings').addEventListener('click', closeSettings);
    $('#scrim').addEventListener('click', closeSettings);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !$('#settings').hidden) closeSettings();
    });

    $('#addAppBtn').addEventListener('click', () => {
      openSettings();
      const form = $('#addAppForm');
      form.scrollIntoView({ block: 'center' });
      form.querySelector('input[name="name"]').focus();
    });
    $('#emptyAddApp').addEventListener('click', () => $('#addAppBtn').click());
    $('#addAppForm').addEventListener('submit', addApp);

    const tokenInput = $('#vercelToken');
    const teamInput = $('#vercelTeam');
    tokenInput.value = state.config.vercelToken;
    teamInput.value = state.config.vercelTeam;
    tokenInput.addEventListener('change', () => {
      state.config.vercelToken = tokenInput.value.trim();
      saveConfig();
      eventLog('info', state.config.vercelToken ? '已保存 Vercel Token' : '已清除 Vercel Token');
    });
    teamInput.addEventListener('change', () => {
      state.config.vercelTeam = teamInput.value.trim();
      saveConfig();
    });

    $('#resetBtn').addEventListener('click', () => {
      if (!window.confirm('恢复默认配置会清空当前应用、Token 与历史记录，确定继续？')) return;
      state.config = loadConfigFrom(DEFAULT_CONFIG);
      state.history = {};
      saveConfig();
      saveHistoryNow();
      fillIntervalSelects();
      renderAppConfig();
      renderApps();
      renderHero();
      toast('已恢复默认配置');
      eventLog('info', '已恢复默认配置');
    });

    $('#clearEvents').addEventListener('click', () => {
      state.events = [];
      renderEvents();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && state.running) {
        tick();
      }
    });

    setInterval(() => {
      if (!state.running) {
        setLiveLabel();
        return;
      }
      setLiveLabel();
      if (Date.now() - (state.lastCheckAt || 0) > 15000 && !document.hidden) {
        $('#overallLead').textContent = '正在重新连接…';
      }
    }, 800);
  }

  function loadConfigFrom(source) {
    return {
      ...source,
      apps: source.apps.map((app) => ({ ...app })),
    };
  }

  function boot() {
    if (window.location.protocol === 'file:') {
      toast('请通过 HTTP(S) 打开发布后的页面，file:// 无法探测目标站点', 'error');
    }
    fillIntervalSelects();
    renderAppConfig();
    renderEvents();
    renderApps();
    renderHero();
    bindEvents();
    document.body.dataset.monitoring = 'running';
    startMonitoring({ silent: true });
    setInterval(() => {
      if (state.running) refreshPlatforms();
    }, PLATFORM_REFRESH_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
