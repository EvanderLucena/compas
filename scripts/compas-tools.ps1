# ==============================================================================
# Compas CLI Tools & AI Harness Dashboard
# ==============================================================================
# Utilitários de produtividade para o ecossistema Compas no Windows (PowerShell 7)
# Inclui:
#   - compas / compas-status : Dashboard de serviços, git, board de tarefas e IA
#   - compas-tasks           : Board de tarefas (Kanban compacto em terminal)
#   - compas-ai              : Métricas de tokens, sessões e quotas de IA
#   - compas-up / down       : Gestão de containers (Postgres, Redis, Evolution)
#   - compas-front / back    : Inicialização rápida dos serviços
#   - compas-kill            : Liberação instantânea de portas travadas (8080/5173)
#   - compas-check           : Verificação de saúde de código local
# ==============================================================================

# Garante saída UTF-8 no console para renderizar ícones e bordas com perfeição
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Get-CompasProjectRoot {
    if (Test-Path "$PSScriptRoot\..\TASKS.md") {
        return (Resolve-Path "$PSScriptRoot\..").Path
    }
    if (Test-Path "$PWD\TASKS.md") {
        return (Resolve-Path "$PWD").Path
    }
    if (Test-Path "$HOME\Documents\NutriAI\TASKS.md") {
        return (Resolve-Path "$HOME\Documents\NutriAI").Path
    }
    return $PWD
}

function Format-Tokens {
    param([long]$Tokens)
    if ($Tokens -ge 1000000) {
        return ("{0:N2}M" -f ($Tokens / 1000000))
    } elseif ($Tokens -ge 1000) {
        return ("{0:N1}k" -f ($Tokens / 1000))
    }
    return "$Tokens"
}

function Get-CompasTasksData {
    param([string]$Root)
    $tasksPath = Join-Path $Root "TASKS.md"
    $handoffsPath = Join-Path $Root ".memory\HANDOFFS.md"

    $activeTask = ""
    $recentDone = [System.Collections.Generic.List[string]]::new()
    $pendingTasks = [System.Collections.Generic.List[string]]::new()

    # 1. Parse HANDOFFS.md
    if (Test-Path $handoffsPath) {
        $lines = Get-Content $handoffsPath -Encoding UTF8
        $inDone = $false
        $inNext = $false
        foreach ($line in $lines) {
            if ($line -match "^\s*-\s*\*\*Conclu[íi]do:\*\*") {
                $inDone = $true; $inNext = $false; continue
            }
            if ($line -match "^\s*-\s*\*\*Pr[óo]ximo Passo:\*\*") {
                $inDone = $false; $inNext = $true; continue
            }
            if ($line -match "^###") {
                if ($activeTask -or $recentDone.Count -gt 0) { break }
            }
            if ($inNext -and $line -match "^\s*-\s*(.+)$") {
                $clean = $matches[1].Trim().Trim('`').Trim('*')
                if (!$activeTask) { $activeTask = $clean }
            }
            if ($inDone -and $line -match "^\s*-\s*(.+)$" -and $recentDone.Count -lt 5) {
                $recentDone.Add($matches[1].Trim().Trim('`').Trim('*'))
            }
        }
    }

    # 2. Parse TASKS.md
    if (Test-Path $tasksPath) {
        $taskLines = Get-Content $tasksPath -Encoding UTF8
        foreach ($line in $taskLines) {
            # In progress marker inside TASKS.md
            if (!$activeTask -and ($line -match "^\s*-\s*\[\s*\]\s*.*\((em andamento|WIP)\)" -or $line -match "^\s*-\s*\[\/\]\s*(.+)$")) {
                $activeTask = $matches[1].Trim().Trim('*')
            }
            if ($line -match "^\s*-\s*\[\s*\]\s*\*\*(.+?)\*\*") {
                $tName = $matches[1].Trim().Trim(':')
                $isSameAsActive = $activeTask -and ($tName -eq $activeTask -or $activeTask.Contains($tName) -or $tName.Contains($activeTask))
                if ($tName -notmatch "Out of scope" -and $line -notmatch "out of scope" -and !$isSameAsActive) {
                    $pendingTasks.Add($tName)
                    if ($pendingTasks.Count -ge 5) { break }
                }
            }
        }
    }

    if (!$activeTask) {
        $activeTask = "Nenhuma tarefa marcada como em andamento no momento."
    }

    return @{
        Active = $activeTask
        Done = $recentDone
        Pending = $pendingTasks
    }
}

function Get-CompasAiStats {
    param([string]$Root)
    $script = Join-Path $Root "scripts\ai-harness-stats.cjs"
    if (Test-Path $script) {
        try {
            $json = node --no-warnings $script
            return ($json | ConvertFrom-Json)
        } catch {
            return $null
        }
    }
    return $null
}

# ==============================================================================
# Comandos Principais
# ==============================================================================

function compas-status {
    <#
    .SYNOPSIS
    Inicia o App Dashboard Interativo do Compas em tempo real ou imprime snapshot.
    #>
    param(
        [switch]$Plain,
        [switch]$Web
    )
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $root = Get-CompasProjectRoot
    $dashboardScript = Join-Path $root "scripts\compas-dashboard.cjs"

    if (Test-Path $dashboardScript) {
        $nodeArgs = @("--no-warnings", $dashboardScript)
        if ($Web) { $nodeArgs += "--web" }
        elseif ($Plain) { $nodeArgs += "--plain" }
        & node $nodeArgs
        return
    }

    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor DarkCyan
    Write-Host "║                   COMPAS CLI — PAINEL DE CONTROLE                          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor DarkCyan

    # 1. Serviços e Portas
    Write-Host "`n📡 SERVIÇOS & INFRAESTRUTURA" -ForegroundColor Yellow
    $ports = [ordered]@{
        "Postgres DB     (5432)" = 5432
        "Redis Cache     (6379)" = 6379
        "Evolution API   (8081)" = 8081
        "Spring Backend  (8080)" = 8080
        "Vite Frontend   (5173)" = 5173
    }
    foreach ($entry in $ports.GetEnumerator()) {
        $p = $entry.Value
        $conn = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        if ($conn) {
            Write-Host ("  {0,-24} : " -f $entry.Key) -NoNewline
            Write-Host "● ONLINE" -ForegroundColor Green
        } else {
            Write-Host ("  {0,-24} : " -f $entry.Key) -NoNewline
            Write-Host "○ offline" -ForegroundColor DarkGray
        }
    }

    # Git
    try {
        $branch = git -C $root branch --show-current 2>$null
        $statusShort = git -C $root status --porcelain 2>$null
        $gitStatus = if ($statusShort) { "$([char]0x1b)[33m$($statusShort.Count) arquivo(s) modificado(s)$([char]0x1b)[0m" } else { "$([char]0x1b)[32mlimpo$([char]0x1b)[0m" }
        Write-Host ("  {0,-24} : 🌿 {1} ({2})" -f "Git Branch", $branch, $gitStatus)
    } catch {}

    # 2. Mini Task Board
    $board = Get-CompasTasksData -Root $root
    Write-Host "`n📌 TASK BOARD (Live de TASKS.md & .memory/HANDOFFS.md)" -ForegroundColor Yellow
    Write-Host "  🟡 EM ANDAMENTO :" -ForegroundColor Yellow
    Write-Host "     ▸ $($board.Active)" -ForegroundColor White

    if ($board.Done.Count -gt 0) {
        Write-Host "  🟢 RECENTES CONCLUÍDAS :" -ForegroundColor Green
        foreach ($d in ($board.Done | Select-Object -First 3)) {
            Write-Host "     ✔ $d" -ForegroundColor Gray
        }
    }

    if ($board.Pending.Count -gt 0) {
        Write-Host "  ⚪ PRÓXIMAS (BACKLOG) :" -ForegroundColor DarkGray
        foreach ($p in ($board.Pending | Select-Object -First 3)) {
            Write-Host "     ⏳ $p" -ForegroundColor DarkGray
        }
    }

    # 3. AI Harness & Usage
    $ai = Get-CompasAiStats -Root $root
    Write-Host "`n🤖 AI HARNESS & CONSUMO" -ForegroundColor Yellow

    if ($ai) {
        # Ollama Cloud / OpenCode
        if ($ai.opencode -and $ai.opencode.available) {
            $oc = $ai.opencode
            Write-Host "  [Ollama Cloud Pro / OpenCode]" -ForegroundColor Cyan
            Write-Host "    Tier          : $($oc.tier)" -ForegroundColor DarkGray
            Write-Host "    Modelo Config : $($oc.configuredModel)" -ForegroundColor White
            if ($oc.lastSession) {
                $inFmt = Format-Tokens $oc.lastSession.tokensInput
                $outFmt = Format-Tokens $oc.lastSession.tokensOutput
                $cacheFmt = Format-Tokens $oc.lastSession.tokensCache
                Write-Host "    Última Sessão : $($oc.lastSession.title)" -ForegroundColor Gray
                Write-Host "                    ($inFmt in | $outFmt out | $cacheFmt cache)" -ForegroundColor DarkGray
            }
            if ($oc.week) {
                $wIn = Format-Tokens $oc.week.tokensInput
                $wOut = Format-Tokens $oc.week.tokensOutput
                Write-Host "    Consumo 7d    : $($oc.week.sessions) sessão(ões) | $wIn in / $wOut out" -ForegroundColor White
            }
        }

        # Antigravity CLI
        if ($ai.antigravity -and $ai.antigravity.available) {
            $agy = $ai.antigravity
            Write-Host "  [Antigravity CLI (Deepmind agy)]" -ForegroundColor Cyan
            Write-Host "    Sessão Ativa  : $($agy.activeConversationId)" -ForegroundColor DarkGray
            Write-Host "    Steps & Log   : $($agy.stepCount) steps | $($agy.transcriptMb) MB transcript" -ForegroundColor White
            Write-Host "    Hub de Memória: .memory/HANDOFFS.md | .skills/ carregadas" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  (Informações de IA disponíveis via scripts/ai-harness-stats.cjs)" -ForegroundColor DarkGray
    }

    # 4. Atalhos
    Write-Host "`n⚡ ATALHOS RÁPIDOS" -ForegroundColor Yellow
    Write-Host "  compas-up    : Sobe Postgres, Redis, Evolution no Docker" -ForegroundColor DarkGray
    Write-Host "  compas-front : Inicia o Frontend Vite (5173)" -ForegroundColor DarkGray
    Write-Host "  compas-back  : Inicia o Backend Spring Boot (8080)" -ForegroundColor DarkGray
    Write-Host "  compas-kill  : Mata processos travados nas portas 8080/5173" -ForegroundColor DarkGray
    Write-Host "  compas-tasks : Visualiza o Board Kanban de tarefas completo" -ForegroundColor DarkGray
    Write-Host "  compas-ai    : Detalhes do consumo de tokens das IAs" -ForegroundColor DarkGray
    Write-Host ""
}

# Alias intuitivo
Set-Alias -Name compas -Value compas-status -Option AllScope -Force -ErrorAction SilentlyContinue

function compas-tasks {
    <#
    .SYNOPSIS
    Exibe o Kanban de tarefas completo do projeto Compas.
    #>
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $root = Get-CompasProjectRoot
    $board = Get-CompasTasksData -Root $root

    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor DarkYellow
    Write-Host "║                      COMPAS — LIVE TASK BOARD                              ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor DarkYellow

    Write-Host "`n🟡 [IN PROGRESS] EM ANDAMENTO AGORA:" -ForegroundColor Yellow
    Write-Host "  ▸ $($board.Active)" -ForegroundColor White

    Write-Host "`n🟢 [DONE] RECENTEMENTE CONCLUÍDAS:" -ForegroundColor Green
    foreach ($d in $board.Done) {
        Write-Host "  ✔ $d" -ForegroundColor Gray
    }

    Write-Host "`n⚪ [BACKLOG] PRÓXIMAS PRIORIDADES:" -ForegroundColor DarkGray
    foreach ($p in $board.Pending) {
        Write-Host "  ⏳ $p" -ForegroundColor DarkGray
    }
    Write-Host ""
}

function compas-ai {
    <#
    .SYNOPSIS
    Exibe métricas detalhadas de consumo de IA (OpenCode / Ollama Cloud e Antigravity).
    #>
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $root = Get-CompasProjectRoot
    $ai = Get-CompasAiStats -Root $root

    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor DarkCyan
    Write-Host "║               COMPAS — AI HARNESS & TOKEN MONITOR                          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor DarkCyan

    if (!$ai) {
        Write-Warning "Não foi possível carregar estatísticas do AI Harness."
        return
    }

    # OpenCode
    Write-Host "`n🤖 OPENCODE & OLLAMA CLOUD" -ForegroundColor Yellow
    $oc = $ai.opencode
    if ($oc.available) {
        Write-Host "  Status       : Conectado" -ForegroundColor Green
        Write-Host "  Tier         : $($oc.tier)" -ForegroundColor White
        Write-Host "  Modelo Atual : $($oc.configuredModel)" -ForegroundColor Cyan
        
        Write-Host "`n  📊 Sessões Recentes (OpenCode SQLite):" -ForegroundColor White
        foreach ($s in $oc.recentSessions) {
            $inFmt = Format-Tokens $s.tokensInput
            $outFmt = Format-Tokens $s.tokensOutput
            Write-Host "    ▸ $($s.title)" -ForegroundColor White
            Write-Host "      Modelo: $($s.model) | In: $inFmt | Out: $outFmt | Custo: `$$($s.cost) | $($s.updatedAt)" -ForegroundColor DarkGray
        }

        Write-Host "`n  📈 Totais Acumulados (Últimos 7 dias):" -ForegroundColor White
        $wIn = Format-Tokens $oc.week.tokensInput
        $wOut = Format-Tokens $oc.week.tokensOutput
        $wCache = Format-Tokens $oc.week.tokensCache
        Write-Host "    Sessões: $($oc.week.sessions)" -ForegroundColor DarkGray
        Write-Host "    Tokens Input : $wIn" -ForegroundColor White
        Write-Host "    Tokens Output: $wOut" -ForegroundColor White
        Write-Host "    Tokens Cache : $wCache" -ForegroundColor White
    } else {
        Write-Host "  Status       : Indisponível ($($oc.reason))" -ForegroundColor DarkGray
    }

    # Antigravity CLI
    Write-Host "`n⚡ ANTIGRAVITY CLI (Google DeepMind agy)" -ForegroundColor Yellow
    $agy = $ai.antigravity
    if ($agy.available) {
        Write-Host "  Conversa ID    : $($agy.activeConversationId)" -ForegroundColor White
        Write-Host "  Steps no Banco : $($agy.stepCount)" -ForegroundColor White
        Write-Host "  Transcript Size: $($agy.transcriptMb) MB" -ForegroundColor White
        Write-Host "  Última Ação    : $($agy.updatedAt)" -ForegroundColor DarkGray
    } else {
        Write-Host "  Status         : $($agy.reason)" -ForegroundColor DarkGray
    }

    Write-Host "`n💡 NOTA SOBRE LIMITES:" -ForegroundColor DarkYellow
    Write-Host "  - Ollama Cloud Pro opera por concorrência (máx 3 modelos simultâneos)." -ForegroundColor DarkGray
    Write-Host "  - Antigravity opera com janelas de cota da conta Google." -ForegroundColor DarkGray
    Write-Host "  - O protocolo de AI Memory (.memory/HANDOFFS.md) permite trocar entre eles sem perda de contexto." -ForegroundColor DarkGray
    Write-Host ""
}

function compas-up {
    <#
    .SYNOPSIS
    Sobe os containers essenciais do Compas via Docker Compose.
    #>
    $root = Get-CompasProjectRoot
    Write-Host "Subindo serviços Docker (Postgres, Redis, Evolution API)..." -ForegroundColor Cyan
    docker compose -f (Join-Path $root "docker\docker-compose.yml") up -d
}

function compas-down {
    <#
    .SYNOPSIS
    Para os containers do Docker Compose.
    #>
    $root = Get-CompasProjectRoot
    Write-Host "Parando containers Docker..." -ForegroundColor Yellow
    docker compose -f (Join-Path $root "docker\docker-compose.yml") down
}

function compas-front {
    <#
    .SYNOPSIS
    Inicia o servidor de desenvolvimento do Vite (Frontend).
    #>
    $root = Get-CompasProjectRoot
    Write-Host "Iniciando Frontend Vite (porta 5173)..." -ForegroundColor Green
    npm --prefix (Join-Path $root "frontend") run dev
}

function compas-back {
    <#
    .SYNOPSIS
    Inicia o backend Spring Boot com profile dev.
    #>
    $root = Get-CompasProjectRoot
    Write-Host "Iniciando Backend Spring Boot (porta 8080)..." -ForegroundColor Green
    & "$root\gradlew.bat" --project-dir (Join-Path $root "backend") bootRun
}

function compas-kill {
    <#
    .SYNOPSIS
    Encontra e mata imediatamente processos que estejam prendendo as portas 8080 e 5173.
    #>
    param([int[]]$Ports = @(8080, 5173))
    Write-Host "Verificando portas ocupadas: $($Ports -join ', ')..." -ForegroundColor Cyan
    $killed = 0
    foreach ($p in $Ports) {
        $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($procId in $pids) {
                if ($procId -gt 0) {
                    try {
                        Stop-Process -Id $procId -Force -ErrorAction Stop
                        Write-Host "✔ Processo $procId finalizado na porta $p" -ForegroundColor Green
                        $killed++
                    } catch {
                        Write-Warning ("Falha ao finalizar processo {0} na porta {1}: {2}" -f $procId, $p, $_)
                    }
                }
            }
        } else {
            Write-Host "Porta $p já está livre." -ForegroundColor DarkGray
        }
    }
    if ($killed -eq 0) {
        Write-Host "Nenhum processo precisou ser finalizado." -ForegroundColor DarkGray
    }
}

function compas-check {
    <#
    .SYNOPSIS
    Executa verificação rápida de compilação do backend e linter do frontend.
    #>
    $root = Get-CompasProjectRoot
    Write-Host "1/2 Verificando compilação do Backend Java..." -ForegroundColor Cyan
    & "$root\gradlew.bat" --project-dir (Join-Path $root "backend") compileJava
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✔ Backend compilou com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "✖ Erro na compilação do backend!" -ForegroundColor Red
        return
    }

    Write-Host "`n2/2 Verificando TypeScript do Frontend..." -ForegroundColor Cyan
    npm --prefix (Join-Path $root "frontend") run lint
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✔ Frontend sem erros de tipagem/lint!" -ForegroundColor Green
    }
}
