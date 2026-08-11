param(
  [int]$Port = 4100,
  [string]$Competition = "premier-league",
  [string]$Team = "arsenal",
  [string]$TeamA = "arsenal",
  [string]$TeamB = "manchester-united",
  [string]$SearchQ = "ajax",
  [switch]$SkipCompare
)

<#
  One-shot backend verification: starts the server hidden, waits for health,
  probes the compare + preview endpoints with timings, then always cleans up.
  No node.exe window pops up and no process is left running afterwards.
#>

$ErrorActionPreference = "Stop"
$BackendDir = (Resolve-Path "$PSScriptRoot\..").Path
$out = Join-Path $env:TEMP "be-verify-out-$Port.txt"
$err = Join-Path $env:TEMP "be-verify-err-$Port.txt"

function Stop-Server($proc) {
  if ($proc -and -not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  }
}

# Pre-check: a stale listener on the port would wedge the spawn.
$busy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($busy) {
  Write-Host "FAIL: port $Port already in use by PID $($busy.OwningProcess). Stop it first." -ForegroundColor Red
  exit 1
}

$env:PORT = "$Port"
$proc = $null
try {
  Write-Host ">> starting backend (hidden) on :$Port ..."
  $proc = Start-Process -FilePath "node" -ArgumentList "dist/index.js" `
    -WorkingDirectory $BackendDir -WindowStyle Hidden `
    -RedirectStandardOutput $out -RedirectStandardError $err -PassThru

  $sw = [Diagnostics.Stopwatch]::StartNew()
  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    if ($proc.HasExited) { throw "server exited early (see $err)" }
    try {
      $null = Invoke-WebRequest "http://localhost:$Port/health" -TimeoutSec 2 -UseBasicParsing
      $ready = $true
      break
    } catch { Start-Sleep -Milliseconds 500 }
  }
  if (-not $ready) { throw "server did not become healthy within 15s (see $err)" }
  $sw.Stop()
  Write-Host ">> server ready in $($sw.ElapsedMilliseconds)ms`n"

  Write-Host ">> request started: GET /api/preview-teams (COLD first hit)"
  $sw2 = [Diagnostics.Stopwatch]::StartNew()
  $r = Invoke-WebRequest "http://localhost:$Port/api/preview-teams?competition=$Competition" -TimeoutSec 60 -UseBasicParsing
  $sw2.Stop()
  $teams = ($r.Content | ConvertFrom-Json)
  Write-Host ">> done: HTTP $($r.StatusCode) teams=$($teams.Count) in $($sw2.ElapsedMilliseconds)ms"

  Write-Host ">> request started: GET /api/preview-teams (WARM repeat)"
  $sw3 = [Diagnostics.Stopwatch]::StartNew()
  $r2 = Invoke-WebRequest "http://localhost:$Port/api/preview-teams?competition=$Competition" -TimeoutSec 30 -UseBasicParsing
  $sw3.Stop()
  $teams2 = ($r2.Content | ConvertFrom-Json)
  Write-Host ">> done: HTTP $($r2.StatusCode) teams=$($teams2.Count) in $($sw3.ElapsedMilliseconds)ms"

  Write-Host ">> request started: GET /api/preview?competition=$Competition&team=$Team"
  $sw4 = [Diagnostics.Stopwatch]::StartNew()
  $r3 = Invoke-WebRequest "http://localhost:$Port/api/preview?competition=$Competition&team=$Team" -TimeoutSec 60 -UseBasicParsing
  $sw4.Stop()
  $p = $r3.Content | ConvertFrom-Json
  Write-Host ">> done: HTTP $($r3.StatusCode) in $($sw4.ElapsedMilliseconds)ms"
  if ($p.event) {
    Write-Host "   event: $($p.event.homeTeam) vs $($p.event.awayTeam) on $($p.event.date)"
    Write-Host "   home: $($p.home.name) $($p.home.formation) conf=$($p.home.confidence) starters=$($p.home.starters.Count)"
    Write-Host "   away: $($p.away.name) $($p.away.formation) conf=$($p.away.confidence) starters=$($p.away.starters.Count)"
  } elseif ($p.message) {
    Write-Host "   message: $($p.message)"
  }

  Write-Host ">> request started: GET /api/fixtures?status=scheduled&competition=$Competition"
  $sw6 = [Diagnostics.Stopwatch]::StartNew()
  $r5 = Invoke-WebRequest "http://localhost:$Port/api/fixtures?status=scheduled&competition=$Competition" -TimeoutSec 60 -UseBasicParsing
  $sw6.Stop()
  $fx = ($r5.Content | ConvertFrom-Json)
  Write-Host ">> done: HTTP $($r5.StatusCode) matches=$($fx.Count) in $($sw6.ElapsedMilliseconds)ms"
  if ($fx.Count -gt 0) {
    Write-Host "   first: $($fx[0].homeTeam.name) vs $($fx[0].awayTeam.name) on $($fx[0].date)"
  }

  Write-Host ">> request started: GET /api/fixtures?status=all (all leagues)"
  $sw7 = [Diagnostics.Stopwatch]::StartNew()
  $r6 = Invoke-WebRequest "http://localhost:$Port/api/fixtures?status=all" -TimeoutSec 90 -UseBasicParsing
  $sw7.Stop()
  $all = ($r6.Content | ConvertFrom-Json)
  $leagues = ($all | ForEach-Object { $_.competitionName } | Sort-Object -Unique) -join ", "
  Write-Host ">> done: HTTP $($r6.StatusCode) matches=$($all.Count) in $($sw7.ElapsedMilliseconds)ms"
  Write-Host "   leagues: $leagues"

  # Wave-1 competition check: Eredivisie standings resolve to slugs and its
  # live season has fixtures.
  Write-Host ">> request started: GET /api/teams?competition=eredivisie"
  $sw8 = [Diagnostics.Stopwatch]::StartNew()
  $r7 = Invoke-WebRequest "http://localhost:$Port/api/teams?competition=eredivisie" -TimeoutSec 60 -UseBasicParsing
  $sw8.Stop()
  $ed = ($r7.Content | ConvertFrom-Json)
  $names = ($ed | ForEach-Object { $_.name } | Select-Object -First 6) -join ", "
  Write-Host ">> done: HTTP $($r7.StatusCode) teams=$($ed.Count) in $($sw8.ElapsedMilliseconds)ms"
  Write-Host "   first: $names"

  Write-Host ">> request started: GET /api/fixtures?status=scheduled&competition=eredivisie"
  $sw9 = [Diagnostics.Stopwatch]::StartNew()
  $r8 = Invoke-WebRequest "http://localhost:$Port/api/fixtures?status=scheduled&competition=eredivisie" -TimeoutSec 60 -UseBasicParsing
  $sw9.Stop()
  $ef = ($r8.Content | ConvertFrom-Json)
  Write-Host ">> done: HTTP $($r8.StatusCode) matches=$($ef.Count) in $($sw9.ElapsedMilliseconds)ms"
  if ($ef.Count -gt 0) {
    Write-Host "   first: $($ef[0].homeTeam.name) vs $($ef[0].awayTeam.name) on $($ef[0].date)"
  }

  Write-Host ">> request started: GET /api/search?q=$SearchQ (first hit - index is warmed at boot)"
  $swS = [Diagnostics.Stopwatch]::StartNew()
  $rS = Invoke-WebRequest "http://localhost:$Port/api/search?q=$SearchQ" -TimeoutSec 120 -UseBasicParsing
  $swS.Stop()
  $hits = ($rS.Content | ConvertFrom-Json)
  $hitList = ($hits | ForEach-Object { "$($_.name) [$($_.competitionName)]" }) -join ", "
  Write-Host ">> done: HTTP $($rS.StatusCode) hits=$($hits.Count) in $($swS.ElapsedMilliseconds)ms"
  Write-Host "   $hitList"

  Write-Host ">> request started: GET /api/search?q=$SearchQ (WARM repeat)"
  $swS2 = [Diagnostics.Stopwatch]::StartNew()
  $rS2 = Invoke-WebRequest "http://localhost:$Port/api/search?q=$SearchQ" -TimeoutSec 30 -UseBasicParsing
  $swS2.Stop()
  $hits2 = ($rS2.Content | ConvertFrom-Json)
  Write-Host ">> done: HTTP $($rS2.StatusCode) hits=$($hits2.Count) in $($swS2.ElapsedMilliseconds)ms"

  if ($hits.Count -gt 0) {
    # Team stats resolve against the pinned (completed) season's standings, so
    # a European-cup hit may legitimately have none in that competition; scan
    # the hits until one resolves (search ranks domestic entries first).
    foreach ($hit in $hits) {
      Write-Host ">> request started: GET /api/team-stats?competition=$($hit.competition)&name=$($hit.name)"
      $qName = [uri]::EscapeDataString($hit.name)
      $swT = [Diagnostics.Stopwatch]::StartNew()
      try {
        $rT = Invoke-WebRequest "http://localhost:$Port/api/team-stats?competition=$($hit.competition)&name=$qName" -TimeoutSec 60 -UseBasicParsing
        $swT.Stop()
        $stats = $rT.Content | ConvertFrom-Json
        Write-Host ">> done: HTTP $($rT.StatusCode) in $($swT.ElapsedMilliseconds)ms"
        Write-Host "   $($stats.name): pos=$($stats.standingPosition) pts=$($stats.wins*3+$stats.draws) W-D-L=$($stats.wins)-$($stats.draws)-$($stats.losses) form=$($stats.form -join '')"
        break
      } catch {
        $swT.Stop()
        Write-Host ">> done: no stats for $($hit.name) in $($hit.competitionName) (in $($swT.ElapsedMilliseconds)ms)"
      }
    }

    # Preview resolves from live-season fixtures, so every hit should work.
    $hit = $hits[0]
    Write-Host ">> request started: GET /api/preview?competition=$($hit.competition)&team=$($hit.id)"
    $swP = [Diagnostics.Stopwatch]::StartNew()
    $rP = Invoke-WebRequest "http://localhost:$Port/api/preview?competition=$($hit.competition)&team=$($hit.id)" -TimeoutSec 60 -UseBasicParsing
    $swP.Stop()
    $p2 = $rP.Content | ConvertFrom-Json
    Write-Host ">> done: HTTP $($rP.StatusCode) in $($swP.ElapsedMilliseconds)ms"
    if ($p2.event) {
      Write-Host "   event: $($p2.event.homeTeam) vs $($p2.event.awayTeam) on $($p2.event.date)"
    } elseif ($p2.message) {
      Write-Host "   message: $($p2.message)"
    }
  }

  if (-not $SkipCompare) {
    Write-Host ">> request started: POST /api/compare ($TeamA vs $TeamB)"
    $body = @{ competition = $Competition; teamA = $TeamA; teamB = $TeamB } | ConvertTo-Json
    $sw5 = [Diagnostics.Stopwatch]::StartNew()
    $r4 = Invoke-WebRequest "http://localhost:$Port/api/compare" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 90 -UseBasicParsing
    $sw5.Stop()
    Write-Host ">> done: HTTP $($r4.StatusCode) in $($sw5.ElapsedMilliseconds)ms"
  }

  Write-Host "`n>> server log tail:"
  Get-Content $out -ErrorAction SilentlyContinue | Select-Object -Last 14 | ForEach-Object { Write-Host "  $_" }
}
catch {
  Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
  if (Test-Path $err) {
    Write-Host "--- stderr ---"
    Get-Content $err | Select-Object -Last 10
  }
  exit 1
}
finally {
  Stop-Server $proc
  Remove-Item -LiteralPath $out, $err -ErrorAction SilentlyContinue
  Write-Host "`n>> server stopped, port $Port released"
}
