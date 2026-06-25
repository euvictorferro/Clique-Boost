#!/bin/bash
# Sync automático do vault Obsidian para GitHub
# Roda em background — faz pull + commit + push a cada 15 minutos

VAULT="/Users/victorferro/Library/Mobile Documents/iCloud~md~obsidian/Documents/[Clique Boost] - Second Brain"
LOG="/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/logs/obsidian-sync.log"

mkdir -p "$(dirname "$LOG")"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG"
}

log "=== Obsidian Sync iniciado ==="

while true; do
  cd "$VAULT" || { log "ERRO: pasta não encontrada"; sleep 900; continue; }

  # Pull primeiro (evita conflitos)
  git pull --rebase origin main 2>&1 | while read line; do log "PULL: $line"; done

  # Verifica se há mudanças
  if [[ -n "$(git status --porcelain)" ]]; then
    git add -A
    git commit -m "vault: auto-sync $(date '+%Y-%m-%d %H:%M')" 2>&1 | while read line; do log "COMMIT: $line"; done
    git push origin main 2>&1 | while read line; do log "PUSH: $line"; done
    log "✅ Sync completo"
  else
    log "— Sem mudanças"
  fi

  sleep 900  # 15 minutos
done
