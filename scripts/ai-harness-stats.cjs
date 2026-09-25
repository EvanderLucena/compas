const fs = require('fs');
const path = require('path');
const os = require('os');

// We use node:sqlite available in Node v22+
let DatabaseSync;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch {
  DatabaseSync = null;
}

function getOpenCodeStats() {
  const opencodeDbPath = path.join(os.homedir(), '.local', 'share', 'opencode', 'opencode.db');
  const opencodeConfigPath = path.join(os.homedir(), '.config', 'opencode', 'opencode.jsonc');

  let configuredModel = 'desconhecido';
  if (fs.existsSync(opencodeConfigPath)) {
    try {
      const content = fs.readFileSync(opencodeConfigPath, 'utf8');
      // simple match for model
      const m = content.match(/"model"\s*:\s*"([^"]+)"/);
      if (m) configuredModel = m[1];
    } catch {}
  }

  if (!DatabaseSync || !fs.existsSync(opencodeDbPath)) {
    return {
      available: false,
      configuredModel,
      reason: !DatabaseSync ? 'node:sqlite não suportado' : 'opencode.db não encontrado'
    };
  }

  try {
    const db = new DatabaseSync(opencodeDbPath, { readOnly: true });

    // Most recent session
    const lastSession = db.prepare(`
      SELECT id, title, model, tokens_input, tokens_output, tokens_cache_read, cost, time_updated
      FROM session
      ORDER BY time_updated DESC
      LIMIT 1
    `).get();

    // Last 3 sessions for detailed view
    const recentSessionsRaw = db.prepare(`
      SELECT id, title, model, tokens_input, tokens_output, tokens_cache_read, cost, time_updated
      FROM session
      ORDER BY time_updated DESC
      LIMIT 3
    `).all();

    const recentSessions = recentSessionsRaw.map(s => {
      let mName = 'desconhecido';
      try {
        const parsed = JSON.parse(s.model);
        mName = parsed.id || 'desconhecido';
      } catch {
        mName = s.model || 'desconhecido';
      }
      return {
        title: s.title || '(sem título)',
        model: mName,
        tokensInput: s.tokens_input || 0,
        tokensOutput: s.tokens_output || 0,
        cost: s.cost || 0,
        updatedAt: s.time_updated ? new Date(s.time_updated).toLocaleString('pt-BR') : null
      };
    });

    // Today's midnight timestamp in ms
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    // 7 days ago timestamp in ms
    const weekStart = todayStart - (6 * 24 * 60 * 60 * 1000);

    const todayAgg = db.prepare(`
      SELECT 
        COUNT(*) as sessionCount,
        SUM(tokens_input) as tokensInput,
        SUM(tokens_output) as tokensOutput,
        SUM(tokens_cache_read) as tokensCache,
        SUM(cost) as totalCost
      FROM session
      WHERE time_updated >= ?
    `).get(todayStart);

    const weekAgg = db.prepare(`
      SELECT 
        COUNT(*) as sessionCount,
        SUM(tokens_input) as tokensInput,
        SUM(tokens_output) as tokensOutput,
        SUM(tokens_cache_read) as tokensCache,
        SUM(cost) as totalCost
      FROM session
      WHERE time_updated >= ?
    `).get(weekStart);

    let parsedModel = configuredModel;
    if (lastSession && lastSession.model) {
      try {
        const m = JSON.parse(lastSession.model);
        parsedModel = m.id || configuredModel;
      } catch {
        parsedModel = lastSession.model;
      }
    }

    return {
      available: true,
      configuredModel,
      activeModel: parsedModel,
      tier: 'Ollama Cloud Pro (Max 3 concorrências)',
      lastSession: lastSession ? {
        title: lastSession.title,
        tokensInput: lastSession.tokens_input || 0,
        tokensOutput: lastSession.tokens_output || 0,
        tokensCache: lastSession.tokens_cache_read || 0,
        cost: lastSession.cost || 0,
        updatedAt: lastSession.time_updated ? new Date(lastSession.time_updated).toLocaleString('pt-BR') : null
      } : null,
      recentSessions,
      today: {
        sessions: todayAgg?.sessionCount || 0,
        tokensInput: todayAgg?.tokensInput || 0,
        tokensOutput: todayAgg?.tokensOutput || 0,
        tokensCache: todayAgg?.tokensCache || 0,
        cost: todayAgg?.totalCost || 0
      },
      week: {
        sessions: weekAgg?.sessionCount || 0,
        tokensInput: weekAgg?.tokensInput || 0,
        tokensOutput: weekAgg?.tokensOutput || 0,
        tokensCache: weekAgg?.tokensCache || 0,
        cost: weekAgg?.totalCost || 0
      }
    };
  } catch (err) {
    return {
      available: false,
      configuredModel,
      error: err.message
    };
  }
}

function getAntigravityStats() {
  const agyBase = path.join(os.homedir(), '.gemini', 'antigravity-cli');
  const convDir = path.join(agyBase, 'conversations');
  const brainDir = path.join(agyBase, 'brain');

  if (!fs.existsSync(convDir)) {
    return { available: false, reason: 'Diretório Antigravity não encontrado' };
  }

  try {
    // Find newest .db in conversations
    const dbFiles = fs.readdirSync(convDir)
      .filter(f => f.endsWith('.db') && !f.includes('-shm') && !f.includes('-wal'))
      .map(f => {
        const full = path.join(convDir, f);
        return { file: f, path: full, stat: fs.statSync(full) };
      })
      .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

    if (dbFiles.length === 0) {
      return { available: false, reason: 'Nenhuma conversa encontrada' };
    }

    const latest = dbFiles[0];
    const convId = latest.file.replace('.db', '');
    let stepCount = 0;

    if (DatabaseSync) {
      try {
        const db = new DatabaseSync(latest.path, { readOnly: true });
        const res = db.prepare('SELECT COUNT(*) as count FROM steps').get();
        stepCount = res?.count || 0;
      } catch {}
    }

    // Check transcript size
    let transcriptBytes = 0;
    const transcriptPath = path.join(brainDir, convId, '.system_generated', 'logs', 'transcript.jsonl');
    if (fs.existsSync(transcriptPath)) {
      transcriptBytes = fs.statSync(transcriptPath).size;
    }

    return {
      available: true,
      activeConversationId: convId,
      stepCount,
      transcriptMb: (transcriptBytes / (1024 * 1024)).toFixed(2),
      updatedAt: latest.stat.mtime.toLocaleString('pt-BR'),
      dbSizeMb: (latest.stat.size / (1024 * 1024)).toFixed(2)
    };
  } catch (err) {
    return { available: false, error: err.message };
  }
}

const report = {
  timestamp: new Date().toISOString(),
  opencode: getOpenCodeStats(),
  antigravity: getAntigravityStats()
};

console.log(JSON.stringify(report, null, 2));
