#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');
const http = require('http');
const { execSync, spawn } = require('child_process');

// Suppress experimental warnings for sqlite
process.removeAllListeners('warning');

let DatabaseSync;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch {
  DatabaseSync = null;
}

const ROOT_DIR = path.resolve(__dirname, '..');
const IS_TTY = Boolean(process.stdout.isTTY);

// ==============================================================================
// 1. DATA GATHERING
// ==============================================================================

function checkPort(port, timeout = 120) {
  return new Promise(resolve => {
    const socket = net.createConnection({ port, host: '127.0.0.1', timeout });
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
  });
}

async function getServicesStatus() {
  const ports = [
    { name: 'Postgres DB', port: 5432, key: 'postgres' },
    { name: 'Redis Cache', port: 6379, key: 'redis' },
    { name: 'Evolution API', port: 8081, key: 'evolution' },
    { name: 'Spring Backend', port: 8080, key: 'backend' },
    { name: 'Vite Frontend', port: 5173, key: 'frontend' }
  ];

  const results = await Promise.all(
    ports.map(async p => ({
      ...p,
      online: await checkPort(p.port)
    }))
  );

  return results;
}

function getGitStatus() {
  try {
    const branch = execSync('git branch --show-current', { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const status = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const modifiedCount = status ? status.split('\n').filter(Boolean).length : 0;
    return { branch: branch || 'main', modifiedCount, clean: modifiedCount === 0 };
  } catch {
    return { branch: 'desconhecido', modifiedCount: 0, clean: true };
  }
}

function getTasksData() {
  const tasksPath = path.join(ROOT_DIR, 'TASKS.md');
  const handoffsPath = path.join(ROOT_DIR, '.memory', 'HANDOFFS.md');

  let activeTask = '';
  const recentDone = [];
  const pendingTasks = [];

  // 1. Parse HANDOFFS.md (top session)
  if (fs.existsSync(handoffsPath)) {
    try {
      const content = fs.readFileSync(handoffsPath, 'utf8').replace(/\r/g, '');
      const lines = content.split('\n');
      let inDone = false;
      let inNext = false;
      for (const line of lines) {
        if (line.includes('**Concluído:**') || line.includes('**Concluido:**')) {
          inDone = true; inNext = false; continue;
        }
        if (line.includes('**Próximo Passo:**') || line.includes('**Proximo Passo:**')) {
          inDone = false; inNext = true; continue;
        }
        if (line.startsWith('### [') && (recentDone.length > 0 || activeTask)) {
          break;
        }
        if (inNext && line.trim().startsWith('-') && !activeTask) {
          activeTask = line.replace(/^\s*-\s*/, '').replace(/[`*]/g, '').trim();
        }
        if (inDone && line.trim().startsWith('-') && recentDone.length < 5) {
          recentDone.push(line.replace(/^\s*-\s*/, '').replace(/[`*]/g, '').trim());
        }
      }
    } catch {}
  }

  // 2. Parse TASKS.md
  if (fs.existsSync(tasksPath)) {
    try {
      const content = fs.readFileSync(tasksPath, 'utf8').replace(/\r/g, '');
      const lines = content.split('\n');
      for (const line of lines) {
        if (!activeTask && (/\[(?:\/|\s)\]\s*.*\((em andamento|WIP)\)/i.test(line) || /\[\/\]\s*(.+)$/.test(line))) {
          const m = line.match(/\[(?:\/|\s)\]\s*(.+?)(?:\(|$)/);
          if (m) activeTask = m[1].replace(/[*`]/g, '').trim();
        }
        if (/^\s*-\s*\[\s*\]\s*\*\*(.+?)\*\*/.test(line)) {
          const m = line.match(/^\s*-\s*\[\s*\]\s*\*\*(.+?)\*\*/);
          if (m) {
            const t = m[1].trim();
            if (!t.toLowerCase().includes('out of scope') && t !== activeTask && pendingTasks.length < 5) {
              pendingTasks.push(t);
            }
          }
        }
      }
    } catch {}
  }

  return {
    active: activeTask || 'Nenhuma tarefa marcada em andamento no momento.',
    done: recentDone,
    pending: pendingTasks
  };
}

let cachedOllamaCloud = null;
let lastOllamaFetch = 0;

function getOllamaApiKey() {
  if (process.env.OLLAMA_API_KEY) return process.env.OLLAMA_API_KEY;
  const cfgPath = path.join(os.homedir(), '.config', 'opencode', 'opencode.jsonc');
  if (fs.existsSync(cfgPath)) {
    try {
      const content = fs.readFileSync(cfgPath, 'utf8');
      const m = content.match(/"apiKey"\s*:\s*"([^"]+)"/);
      if (m) return m[1];
    } catch {}
  }
  return null;
}

async function fetchOllamaCloudApi() {
  const now = Date.now();
  if (cachedOllamaCloud && (now - lastOllamaFetch) < 15000) {
    return cachedOllamaCloud;
  }

  const apiKey = getOllamaApiKey();
  if (!apiKey) return cachedOllamaCloud;

  try {
    const res = await fetch('https://ollama.com/api/usage', {
      headers: { Authorization: 'Bearer ' + apiKey },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      lastOllamaFetch = now;
      const sModels = data.limits?.session?.models || [];
      const wModels = data.limits?.weekly?.models || [];
      const totalWeeklyReqs = wModels.reduce((acc, m) => acc + (m.request_count || 0), 0);
      const topWeeklyModel = wModels[0] || null;

      cachedOllamaCloud = {
        available: true,
        sessionUsagePct: (data.limits?.session?.usage != null ? (data.limits.session.usage * 100) : 0),
        weeklyUsagePct: (data.limits?.weekly?.usage != null ? (data.limits.weekly.usage * 100) : 0),
        sessionModels: sModels,
        weeklyModels: wModels,
        topWeeklyModel,
        totalWeeklyRequests: totalWeeklyReqs
      };
      return cachedOllamaCloud;
    }
  } catch {}
  return cachedOllamaCloud;
}

async function getAiMetrics() {
  const ollamaCloud = await fetchOllamaCloudApi();

  // OpenCode
  const opencodeDb = path.join(os.homedir(), '.local', 'share', 'opencode', 'opencode.db');
  const opencodeConfig = path.join(os.homedir(), '.config', 'opencode', 'opencode.jsonc');

  let configuredModel = 'glm-5.1:cloud';
  if (fs.existsSync(opencodeConfig)) {
    try {
      const c = fs.readFileSync(opencodeConfig, 'utf8');
      const m = c.match(/"model"\s*:\s*"([^"]+)"/);
      if (m) configuredModel = m[1];
    } catch {}
  }

  let opencode = {
    available: false,
    configuredModel,
    activeModel: configuredModel,
    tier: 'Ollama Cloud Pro (Max 3 concorrências)',
    lastSession: null,
    weekTokens: 0,
    weekCost: 0,
    weekBudget: 15.00,
    weekTokensTarget: 10000000
  };

  if (DatabaseSync && fs.existsSync(opencodeDb)) {
    try {
      const db = new DatabaseSync(opencodeDb, { readOnly: true });
      const last = db.prepare(`
        SELECT title, model, tokens_input, tokens_output, tokens_cache_read, cost, time_updated
        FROM session
        ORDER BY time_updated DESC
        LIMIT 1
      `).get();

      const weekStart = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const weekAgg = db.prepare(`
        SELECT 
          COUNT(*) as cnt,
          SUM(tokens_input + tokens_output) as totalTokens,
          SUM(cost) as totalCost
        FROM session
        WHERE time_updated >= ?
      `).get(weekStart);

      let mName = configuredModel;
      if (last && last.model) {
        try {
          const parsed = JSON.parse(last.model);
          mName = parsed.id || configuredModel;
        } catch {
          mName = last.model;
        }
      }

      opencode.available = true;
      opencode.activeModel = mName;
      opencode.lastSession = last ? {
        title: last.title || '(sem título)',
        tokensInput: last.tokens_input || 0,
        tokensOutput: last.tokens_output || 0,
        tokensCache: last.tokens_cache_read || 0,
        cost: last.cost || 0
      } : null;
      opencode.weekTokens = weekAgg?.totalTokens || (last ? (last.tokens_input + last.tokens_output) : 0);
      opencode.weekCost = weekAgg?.totalCost || (last ? last.cost : 0);
    } catch {}
  }

  // Antigravity CLI
  const agyBase = path.join(os.homedir(), '.gemini', 'antigravity-cli');
  const convDir = path.join(agyBase, 'conversations');
  const brainDir = path.join(agyBase, 'brain');

  let antigravity = {
    available: false,
    conversationId: 'desconhecido',
    stepCount: 0,
    stepSoftLimit: 30000,
    transcriptMb: 0,
    transcriptSoftLimitMb: 50
  };

  if (fs.existsSync(convDir)) {
    try {
      const dbFiles = fs.readdirSync(convDir)
        .filter(f => f.endsWith('.db') && !f.includes('-shm') && !f.includes('-wal'))
        .map(f => ({ name: f, path: path.join(convDir, f), stat: fs.statSync(path.join(convDir, f)) }))
        .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

      if (dbFiles.length > 0) {
        const latest = dbFiles[0];
        const convId = latest.name.replace('.db', '');
        let stepCount = 0;
        if (DatabaseSync) {
          try {
            const db = new DatabaseSync(latest.path, { readOnly: true });
            const r = db.prepare('SELECT COUNT(*) as cnt FROM steps').get();
            stepCount = r?.cnt || 0;
          } catch {}
        }
        let transcriptBytes = 0;
        const transcriptPath = path.join(brainDir, convId, '.system_generated', 'logs', 'transcript.jsonl');
        if (fs.existsSync(transcriptPath)) {
          transcriptBytes = fs.statSync(transcriptPath).size;
        }

        antigravity.available = true;
        antigravity.conversationId = convId;
        antigravity.stepCount = stepCount;
        antigravity.transcriptMb = Number((transcriptBytes / (1024 * 1024)).toFixed(2));
      }
    } catch {}
  }

  return { opencode, antigravity, ollamaCloud };
}

// ==============================================================================
// 2. TUI RENDERING UTILITIES
// ==============================================================================

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  brightCyan: '\x1b[96m',
  yellow: '\x1b[33m',
  brightYellow: '\x1b[93m',
  green: '\x1b[32m',
  brightGreen: '\x1b[92m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  white: '\x1b[37m',
  bgDark: '\x1b[48;5;235m'
};

function formatTokens(t) {
  if (t >= 1000000) return (t / 1000000).toFixed(2) + 'M';
  if (t >= 1000) return (t / 1000).toFixed(1) + 'k';
  return String(t);
}

function makeBar(current, max, width = 18, unit = '') {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(100, (current / safeMax) * 100));
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;

  let color = C.green;
  if (pct > 65) color = C.yellow;
  if (pct > 85) color = C.red;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${color}${bar}${C.reset} ${C.bold}${pct.toFixed(1)}%${C.reset} ${C.dim}(${current}${unit} / ${max}${unit})${C.reset}`;
}

function truncate(str, len) {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + '…';
}

function padRight(str, len) {
  const plain = str.replace(/\x1b\[[0-9;]*m/g, '');
  if (plain.length === len) return str;
  if (plain.length > len) {
    return plain.slice(0, len - 1) + '…';
  }
  return str + ' '.repeat(len - plain.length);
}

// ==============================================================================
// 3. FULL TERMINAL DASHBOARD SCREEN
// ==============================================================================

async function renderDashboard(statusMessage = '') {
  const width = Math.max(80, Math.min(120, process.stdout.columns || 100));
  const [services, git, tasks, ai] = await Promise.all([
    getServicesStatus(),
    Promise.resolve(getGitStatus()),
    Promise.resolve(getTasksData()),
    Promise.resolve(getAiMetrics())
  ]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR');
  const dateStr = now.toLocaleDateString('pt-BR');

  const lines = [];

  // Top Header
  lines.push(`${C.brightCyan}╔═${'═'.repeat(width - 4)}═╗${C.reset}`);
  const title = `COMPAS CLI — LIVE WORKSPACE & AI DASHBOARD`;
  const timeInfo = `${dateStr} ${timeStr} ● LIVE`;
  const padMiddle = width - 4 - title.length - timeInfo.length;
  lines.push(`${C.brightCyan}║ ${C.bold}${C.white}${title}${C.reset}${' '.repeat(Math.max(1, padMiddle))}${C.brightGreen}${timeInfo}${C.brightCyan} ║${C.reset}`);
  lines.push(`${C.brightCyan}╠═${'═'.repeat(width - 4)}═╣${C.reset}`);

  // 1. Services Row
  const svcBadges = services.map(s => {
    const dot = s.online ? `${C.brightGreen}● ${C.white}${s.name}:${C.brightGreen}${s.port}${C.reset}` : `${C.gray}○ ${s.name}:${s.port}${C.reset}`;
    return dot;
  }).join('   ');
  const gitBadge = git.clean 
    ? `${C.brightGreen}🌿 ${git.branch} (limpo)${C.reset}`
    : `${C.brightYellow}🌿 ${git.branch} (${git.modifiedCount} modif)${C.reset}`;

  lines.push(`${C.brightCyan}║ ${C.bold}${C.yellow}SERVIÇOS:${C.reset} ${svcBadges}   ${C.bold}${C.yellow}GIT:${C.reset} ${gitBadge}`);
  lines.push(`${C.brightCyan}╠═${'═'.repeat(width - 4)}═╣${C.reset}`);

  // 2. AI Harness & Quotas with Gauges
  lines.push(`${C.brightCyan}║ ${C.bold}${C.yellow}🤖 AI HARNESS & CONSUMO DE TOKENS (LIMITES E COTAS AO VIVO)${C.reset}`);
  
  // Ollama Cloud Pro (Live Official API)
  if (ai.ollamaCloud && ai.ollamaCloud.available) {
    const oCloud = ai.ollamaCloud;
    const sessionBar = makeBar(Number(oCloud.sessionUsagePct.toFixed(1)), 100, 16, '%');
    const weeklyBar = makeBar(Number(oCloud.weeklyUsagePct.toFixed(1)), 100, 16, '%');
    const sModelsSummary = oCloud.sessionModels.map(m => `${m.name} (${m.request_count})`).join(', ') || '0 reqs';
    const topModelStr = oCloud.topWeeklyModel ? `${oCloud.topWeeklyModel.name} (${oCloud.topWeeklyModel.request_count} reqs)` : 'desconhecido';

    lines.push(`${C.brightCyan}║ ${C.brightCyan}[Ollama Cloud Pro — Dados Oficiais ao Vivo]${C.reset} Tier: ${C.white}Pro (3 concorrências)${C.reset}`);
    lines.push(`${C.brightCyan}║   • Session Usage (Reseta em ~1h)   : ${sessionBar} ${C.dim}[${sModelsSummary}]${C.reset}`);
    lines.push(`${C.brightCyan}║   • Weekly Usage (Cota Semanal)     : ${weeklyBar} ${C.dim}[${topModelStr} | ${oCloud.totalWeeklyRequests} total]${C.reset}`);
    if (ai.opencode && ai.opencode.lastSession) {
      const oc = ai.opencode;
      const sIn = formatTokens(oc.lastSession.tokensInput);
      const sOut = formatTokens(oc.lastSession.tokensOutput);
      const sCache = formatTokens(oc.lastSession.tokensCache);
      lines.push(`${C.brightCyan}║   • OpenCode Última Sessão: ${C.dim}"${truncate(oc.lastSession.title, 36)}"${C.reset} (${C.white}${sIn} in${C.reset} | ${C.white}${sOut} out${C.reset} | ${C.dim}${sCache} cache${C.reset})`);
    }
  } else {
    // Fallback to local SQLite
    const oc = ai.opencode;
    const costBar = makeBar(Number(oc.weekCost.toFixed(2)), oc.weekBudget, 16, '$');
    const tokenFmt = (oc.weekTokens / 1000000).toFixed(2);
    const tokenMaxFmt = (oc.weekTokensTarget / 1000000).toFixed(1);
    const tokenBar = makeBar(Number(tokenFmt), Number(tokenMaxFmt), 16, 'M');

    lines.push(`${C.brightCyan}║ ${C.brightCyan}[Ollama Cloud Pro / OpenCode]${C.reset} Modelo: ${C.white}${oc.activeModel}${C.reset} | Tier: ${C.dim}${oc.tier}${C.reset}`);
    lines.push(`${C.brightCyan}║   • Cota Semanal Créditos ($15/sem) : ${costBar}`);
    lines.push(`${C.brightCyan}║   • Volume Tokens Semana (Meta 10M) : ${tokenBar}`);
    if (oc.lastSession) {
      const sIn = formatTokens(oc.lastSession.tokensInput);
      const sOut = formatTokens(oc.lastSession.tokensOutput);
      const sCache = formatTokens(oc.lastSession.tokensCache);
      lines.push(`${C.brightCyan}║   • Última Sessão: ${C.dim}"${truncate(oc.lastSession.title, 42)}"${C.reset} (${C.white}${sIn} in${C.reset} | ${C.white}${sOut} out${C.reset} | ${C.dim}${sCache} cache${C.reset})`);
    }
  }

  // Antigravity CLI
  const agy = ai.antigravity;
  const stepsFmt = (agy.stepCount / 1000).toFixed(1);
  const stepsMaxFmt = (agy.stepSoftLimit / 1000).toFixed(0);
  const stepsBar = makeBar(Number(stepsFmt), Number(stepsMaxFmt), 16, 'k steps');
  const mbBar = makeBar(agy.transcriptMb, agy.transcriptSoftLimitMb, 16, 'MB');

  lines.push(`${C.brightCyan}║ ${C.brightCyan}[Antigravity CLI (DeepMind agy)]${C.reset} Conversa: ${C.dim}${agy.conversationId.slice(0, 18)}...${C.reset}`);
  lines.push(`${C.brightCyan}║   • Janela de Sessão (Steps)        : ${stepsBar}`);
  lines.push(`${C.brightCyan}║   • Tamanho Transcript Buffer       : ${mbBar}`);
  lines.push(`${C.brightCyan}╠═${'═'.repeat(width - 4)}═╣${C.reset}`);

  // 3. Live 3-Column Task Kanban Board
  lines.push(`${C.brightCyan}║ ${C.bold}${C.yellow}📌 LIVE TASK KANBAN (Sincronizado com TASKS.md & .memory/HANDOFFS.md)${C.reset}`);
  
  const colWidth = Math.floor((width - 8) / 3);
  const c1Header = padRight(`🟡 EM ANDAMENTO`, colWidth);
  const c2Header = padRight(`🟢 RECENTES CONCLUÍDAS`, colWidth);
  const c3Header = padRight(`⚪ PRÓXIMAS / BACKLOG`, colWidth);
  lines.push(`${C.brightCyan}║ ${C.bold}${C.brightYellow}${c1Header}${C.reset} │ ${C.bold}${C.brightGreen}${c2Header}${C.reset} │ ${C.bold}${C.gray}${c3Header}${C.reset}`);
  lines.push(`${C.brightCyan}║ ${'─'.repeat(colWidth)}─┼─${'─'.repeat(colWidth)}─┼─${'─'.repeat(colWidth)}`);

  // Active Task text lines
  const activeLines = [];
  const words = tasks.active.split(' ');
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).length <= colWidth - 4) {
      cur += (cur ? ' ' : '') + w;
    } else {
      activeLines.push(cur);
      cur = w;
    }
  }
  if (cur) activeLines.push(cur);

  const doneLines = tasks.done.map(d => '✔ ' + truncate(d, colWidth - 4));
  const pendingLines = tasks.pending.map(p => '⏳ ' + truncate(p, colWidth - 4));

  const maxRows = Math.max(activeLines.length + 1, doneLines.length, pendingLines.length, 4);

  for (let i = 0; i < maxRows; i++) {
    let col1Text = '';
    if (i === 0 && activeLines.length > 0) {
      col1Text = `${C.brightYellow}▸ ${C.white}${activeLines[0]}${C.reset}`;
    } else if (i > 0 && i < activeLines.length) {
      col1Text = `  ${C.white}${activeLines[i]}${C.reset}`;
    } else if (i === activeLines.length && activeLines.length > 0) {
      col1Text = `  ${C.dim}[Agente Ativo]${C.reset}`;
    }

    const col2Text = doneLines[i] ? `${C.green}${doneLines[i]}${C.reset}` : '';
    const col3Text = pendingLines[i] ? `${C.gray}${pendingLines[i]}${C.reset}` : '';

    const p1 = padRight(col1Text, colWidth);
    const p2 = padRight(col2Text, colWidth);
    const p3 = padRight(col3Text, colWidth);

    lines.push(`${C.brightCyan}║ ${p1} │ ${p2} │ ${p3}`);
  }

  lines.push(`${C.brightCyan}╠═${'═'.repeat(width - 4)}═╣${C.reset}`);

  // Status message bar if any
  if (statusMessage) {
    lines.push(`${C.brightCyan}║ ${C.brightYellow}⚡ ${statusMessage}${C.reset}`);
    lines.push(`${C.brightCyan}╠═${'═'.repeat(width - 4)}═╣${C.reset}`);
  }

  // Footer keybindings
  const keys = `[q] Sair   [r] Atualizar   [u] Docker Up   [d] Docker Down   [k] Kill Portas   [w] Abrir Web UI`;
  lines.push(`${C.brightCyan}║ ${C.bold}${C.white}${padRight(keys, width - 4)}${C.brightCyan} ║${C.reset}`);
  lines.push(`${C.brightCyan}╚═${'═'.repeat(width - 4)}═╝${C.reset}`);

  return lines.join('\n');
}

// ==============================================================================
// 4. ACTION EXECUTORS
// ==============================================================================

function killPorts() {
  const ports = [8080, 5173];
  try {
    for (const p of ports) {
      if (process.platform === 'win32') {
        const out = execSync(`Get-NetTCPConnection -LocalPort ${p} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`, {
          shell: 'pwsh.exe',
          encoding: 'utf8'
        }).trim();
        if (out) {
          const pids = out.split('\n').map(s => s.trim()).filter(Boolean);
          for (const pid of pids) {
            execSync(`Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue`, { shell: 'pwsh.exe' });
          }
        }
      }
    }
    return 'Portas 8080 e 5173 liberadas com sucesso!';
  } catch (err) {
    return 'Falha ao liberar portas: ' + err.message;
  }
}

function dockerUp() {
  try {
    const composeFile = path.join(ROOT_DIR, 'docker', 'docker-compose.yml');
    execSync(`docker compose -f "${composeFile}" up -d`, { stdio: 'ignore' });
    return 'Containers Docker iniciados (Postgres, Redis, Evolution)!';
  } catch (err) {
    return 'Erro ao subir containers Docker: ' + err.message;
  }
}

function dockerDown() {
  try {
    const composeFile = path.join(ROOT_DIR, 'docker', 'docker-compose.yml');
    execSync(`docker compose -f "${composeFile}" down`, { stdio: 'ignore' });
    return 'Containers Docker finalizados.';
  } catch (err) {
    return 'Erro ao parar containers Docker: ' + err.message;
  }
}

// ==============================================================================
// 5. WEB DASHBOARD SERVER (--web or 'w')
// ==============================================================================

function startWebServer(port = 3333) {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/api/data') {
      const [services, git, tasks, ai] = await Promise.all([
        getServicesStatus(),
        Promise.resolve(getGitStatus()),
        Promise.resolve(getTasksData()),
        Promise.resolve(getAiMetrics())
      ]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ services, git, tasks, ai, timestamp: new Date().toISOString() }));
    }

    if (req.url === '/api/action/kill') {
      const msg = killPorts();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: msg }));
    }

    if (req.url === '/api/action/up') {
      const msg = dockerUp();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, message: msg }));
    }

    // Serve HTML Dashboard
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Compas — Live Workspace & AI Dashboard</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    :root {
      --bg: #0d1117;
      --card: #161b22;
      --border: #30363d;
      --accent: #58a6ff;
      --green: #3fb950;
      --yellow: #d29922;
      --red: #f85149;
      --text: #c9d1d9;
      --text-muted: #8b949e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; }
    body { background: var(--bg); color: var(--text); padding: 24px; }
    header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 16px; margin-bottom: 24px; }
    h1 { font-size: 22px; color: #fff; display: flex; align-items: center; gap: 10px; }
    .live-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--green); display: inline-block; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
    .grid-top { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
    .badge-on { background: rgba(63, 185, 80, 0.15); color: var(--green); border: 1px solid var(--green); }
    .badge-off { background: rgba(139, 148, 158, 0.15); color: var(--text-muted); border: 1px solid var(--border); }
    .kanban { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .col-header { font-size: 14px; font-weight: bold; padding-bottom: 8px; border-bottom: 2px solid var(--border); margin-bottom: 12px; }
    .col-yellow { border-color: var(--yellow); color: var(--yellow); }
    .col-green { border-color: var(--green); color: var(--green); }
    .col-gray { border-color: var(--text-muted); color: var(--text-muted); }
    .kanban-item { background: #1c2128; border: 1px solid var(--border); border-radius: 6px; padding: 12px; margin-bottom: 10px; font-size: 13px; line-height: 1.4; }
    .bar-wrap { margin-top: 10px; }
    .bar-bg { background: #21262d; border-radius: 6px; height: 12px; overflow: hidden; margin-top: 4px; }
    .bar-fill { height: 100%; border-radius: 6px; transition: width 0.4s ease; }
    .actions { display: flex; gap: 12px; margin-top: 20px; }
    button { background: #238636; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; }
    button.btn-danger { background: #da3633; }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <header>
    <h1><span class="live-dot"></span> Compas Live Workspace & AI Monitor</h1>
    <div id="clock" style="font-size: 14px; color: var(--text-muted);">Conectando...</div>
  </header>

  <div class="grid-top" id="services-grid"></div>

  <div class="card" style="margin-bottom: 24px;">
    <h2 style="font-size: 16px; color: #fff; margin-bottom: 16px;">🤖 Consumo de IA, Limites Semanais & Quotas</h2>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;" id="ai-grid"></div>
  </div>

  <div class="kanban">
    <div class="card">
      <div class="col-header col-yellow">🟡 EM ANDAMENTO</div>
      <div id="col-active"></div>
    </div>
    <div class="card">
      <div class="col-header col-green">🟢 RECENTES CONCLUÍDAS</div>
      <div id="col-done"></div>
    </div>
    <div class="card">
      <div class="col-header col-gray">⚪ PRÓXIMAS / BACKLOG</div>
      <div id="col-pending"></div>
    </div>
  </div>

  <div class="actions">
    <button onclick="fetch('/api/action/up').then(()=>update())">Docker Compose Up</button>
    <button class="btn-danger" onclick="fetch('/api/action/kill').then(()=>update())">Liberar Portas (Kill 8080/5173)</button>
  </div>

  <script>
    async function update() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        document.getElementById('clock').innerText = new Date(data.timestamp).toLocaleTimeString('pt-BR') + ' (Atualizado)';

        // Services
        const sHtml = data.services.map(s => \`
          <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; font-size: 14px;">\${s.name}</div>
              <div style="font-size: 12px; color: var(--text-muted);">Porta \${s.port}</div>
            </div>
            <span class="badge \${s.online ? 'badge-on' : 'badge-off'}">\${s.online ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        \`).join('') + \`
          <div class="card" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; font-size: 14px;">Git Branch</div>
              <div style="font-size: 12px; color: var(--text-muted);">\${data.git.branch}</div>
            </div>
            <span class="badge \${data.git.clean ? 'badge-on' : 'badge-off'}">\${data.git.clean ? 'LIMPO' : data.git.modifiedCount + ' MODIF'}</span>
          </div>
        \`;
        document.getElementById('services-grid').innerHTML = sHtml;

        // AI Metrics
        const oc = data.ai.opencode;
        const agy = data.ai.antigravity;
        const oCloud = data.ai.ollamaCloud;
        const sUsage = oCloud ? Number(oCloud.sessionUsagePct.toFixed(1)) : 0;
        const wUsage = oCloud ? Number(oCloud.weeklyUsagePct.toFixed(1)) : 0;
        const topModel = (oCloud && oCloud.topWeeklyModel) ? oCloud.topWeeklyModel.name + ' (' + oCloud.topWeeklyModel.request_count + ' reqs)' : 'glm-5.3-flash';
        const stepsPct = Math.min(100, (agy.stepCount / agy.stepSoftLimit) * 100).toFixed(1);

        document.getElementById('ai-grid').innerHTML = \`
          <div>
            <div style="font-weight: 600; color: var(--accent); margin-bottom: 8px;">Ollama Cloud Pro (Dados Oficiais ao Vivo)</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Top Model: \${topModel} | Tier: Pro</div>
            <div class="bar-wrap">
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span>Session Usage (Reseta em ~1h)</span>
                <span style="font-weight: bold; color: \${sUsage > 80 ? 'var(--red)' : 'var(--green)'};">\${sUsage}% used</span>
              </div>
              <div class="bar-bg"><div class="bar-fill" style="width: \${sUsage}%; background: \${sUsage > 80 ? 'var(--red)' : 'var(--green)'};"></div></div>
            </div>
            <div class="bar-wrap">
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span>Weekly Usage</span>
                <span style="font-weight: bold; color: \${wUsage > 80 ? 'var(--red)' : 'var(--yellow)'};">\${wUsage}% used</span>
              </div>
              <div class="bar-bg"><div class="bar-fill" style="width: \${wUsage}%; background: var(--accent);"></div></div>
            </div>
          </div>
          <div>
            <div style="font-weight: 600; color: var(--accent); margin-bottom: 8px;">Antigravity CLI (DeepMind agy)</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">Conversa: \${agy.conversationId.slice(0, 18)}...</div>
            <div class="bar-wrap">
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span>Steps na Sessão Atual</span>
                <span style="font-weight: bold;">\${stepsPct}% (\${agy.stepCount} / \${agy.stepSoftLimit})</span>
              </div>
              <div class="bar-bg"><div class="bar-fill" style="width: \${stepsPct}%; background: var(--yellow);"></div></div>
            </div>
            <div class="bar-wrap">
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span>Transcript Buffer</span>
                <span style="font-weight: bold;">\${agy.transcriptMb} MB / \${agy.transcriptSoftLimitMb} MB</span>
              </div>
              <div class="bar-bg"><div class="bar-fill" style="width: \${Math.min(100, (agy.transcriptMb/agy.transcriptSoftLimitMb)*100)}%; background: var(--green);"></div></div>
            </div>
          </div>
        \`;

        // Kanban
        document.getElementById('col-active').innerHTML = \`<div class="kanban-item" style="border-left: 3px solid var(--yellow); font-weight: 500;">\${data.tasks.active}</div>\`;
        document.getElementById('col-done').innerHTML = data.tasks.done.map(d => \`<div class="kanban-item" style="border-left: 3px solid var(--green);">✔ \${d}</div>\`).join('');
        document.getElementById('col-pending').innerHTML = data.tasks.pending.map(p => \`<div class="kanban-item" style="border-left: 3px solid var(--border);">⏳ \${p}</div>\`).join('');
      } catch (err) {
        console.error(err);
      }
    }
    update();
    setInterval(update, 2000);
  </script>
</body>
</html>`);
  });

  server.listen(port, () => {
    console.log(`\n✔ Compas Web Dashboard rodando em: http://localhost:${port}`);
    if (process.platform === 'win32') {
      execSync(`start http://localhost:${port}`);
    }
  });
}

// ==============================================================================
// 6. MAIN CONTROLLER
// ==============================================================================

async function startTui() {
  let isRawSupported = false;
  try {
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
      isRawSupported = true;
    }
  } catch {}

  if (args.includes('--plain') || (!isRawSupported && !process.stdout.isTTY)) {
    const output = await renderDashboard();
    console.log(output);
    process.exit(0);
  }

  // Enter alternate buffer and hide cursor
  process.stdout.write('\x1b[?1049h\x1b[?25l');

  let statusMsg = '';
  let statusTimeout = null;

  function setStatus(msg) {
    statusMsg = msg;
    if (statusTimeout) clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      statusMsg = '';
      draw();
    }, 4000);
    draw();
  }

  async function draw() {
    try {
      const screen = await renderDashboard(statusMsg);
      process.stdout.write('\x1b[H' + screen);
    } catch {}
  }

  function cleanup() {
    try {
      process.stdout.write('\x1b[?1049l\x1b[?25h');
    } catch {}
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // Setup raw mode for key input
  if (isRawSupported) {
    try {
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', async key => {
        if (key === 'q' || key === '\u0003' || key === '\u001b') {
          cleanup();
        } else if (key === 'r') {
          setStatus('Atualizando dados...');
        } else if (key === 'u') {
          setStatus('Executando Docker Compose Up...');
          const res = dockerUp();
          setStatus(res);
        } else if (key === 'd') {
          setStatus('Executando Docker Compose Down...');
          const res = dockerDown();
          setStatus(res);
        } else if (key === 'k') {
          setStatus('Liberando portas 8080 e 5173...');
          const res = killPorts();
          setStatus(res);
        } else if (key === 'w') {
          setStatus('Iniciando Web Dashboard em http://localhost:3333...');
          startWebServer(3333);
        }
      });
    } catch {}
  }

  // Initial draw
  await draw();

  // 1.5s refresh loop — KEPT ACTIVE!
  const interval = setInterval(async () => {
    await draw();
  }, 1500);
}

// Check args
const args = process.argv.slice(2);
if (args.includes('--web')) {
  startWebServer(3333);
} else if (args.includes('--plain')) {
  renderDashboard().then(out => {
    console.log(out);
  });
} else {
  startTui();
}
