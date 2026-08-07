#!/bin/zsh
# Auto-deploy RogueReporter on file changes
# Usage: Run once in Terminal.app, leave it running
#   ./watch-deploy.sh

cd "$(dirname "$0")"
echo "👁 Watching RogueReporter for changes..."
echo "   Edit files in VS Code → auto build + deploy"
echo "   Press Ctrl+C to stop\n"

LAST_HASH=""

while true; do
    # Hash all source files to detect changes
    CURRENT_HASH=$(find src public/data index.html -type f 2>/dev/null | sort | xargs cat 2>/dev/null | shasum)
    
    if [[ "$CURRENT_HASH" != "$LAST_HASH" && -n "$LAST_HASH" ]]; then
        echo "\n$(date '+%H:%M:%S') 🔨 Changes detected — building..."
        
        if npx vite build 2>&1; then
            echo "$(date '+%H:%M:%S') 🚀 Deploying..."
            if firebase deploy 2>&1; then
                echo "$(date '+%H:%M:%S') ✅ Live at roguereporter-game.web.app"
                
                # Auto-commit too
                cd ..
                git add RogueReporter/ && git commit -m "auto: $(date '+%Y-%m-%d %H:%M')" --no-verify 2>/dev/null
                cd RogueReporter
            else
                echo "$(date '+%H:%M:%S') ❌ Deploy failed"
            fi
        else
            echo "$(date '+%H:%M:%S') ❌ Build failed"
        fi
    fi
    
    LAST_HASH="$CURRENT_HASH"
    sleep 3
done
