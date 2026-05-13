#!/bin/bash
# Generate background music using AudioPod AI
# Usage: ./scripts/generate-bgm.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../public/launch"
mkdir -p "$OUTPUT_DIR"

# Get API key
AUDIOPOD_API_KEY="${AUDIOPOD_AI_API_KEY:-ap_vCi4UvDD4MrPSdezkke4LmI3pgBG7VhDZfh7Kb58cBU}"

echo "🎵 Generating background music with AudioPod AI..."

# Start instrumental generation job
RESPONSE=$(curl -s -X POST "https://api.audiopod.ai/v1/music/instrumental" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $AUDIOPOD_API_KEY" \
  -d '{
    "prompt": "Modern tech product launch music, inspiring corporate background, subtle electronic elements, building momentum, cinematic underscore, professional and innovative feel, soft synth pads, gentle percussion, uplifting but not overpowering, 100 bpm",
    "duration": 45,
    "output_format": "mp3"
  }')

JOB_ID=$(echo "$RESPONSE" | jq -r '.job_id // .id // empty')

if [ -z "$JOB_ID" ]; then
    echo "❌ Failed to start job. Response:"
    echo "$RESPONSE"
    exit 1
fi

echo "📋 Job started: $JOB_ID"

# Poll for completion
MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
    
    STATUS_RESPONSE=$(curl -s "https://api.audiopod.ai/v1/music/jobs/$JOB_ID" \
      -H "X-API-Key: $AUDIOPOD_API_KEY")
    
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
    echo "⏳ Status: $STATUS (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    
    if [ "$STATUS" = "completed" ]; then
        AUDIO_URL=$(echo "$STATUS_RESPONSE" | jq -r '.output_url // .audio_url // .download_url // empty')
        
        if [ -n "$AUDIO_URL" ]; then
            echo "⬇️ Downloading from $AUDIO_URL..."
            curl -s -o "$OUTPUT_DIR/background-music.mp3" "$AUDIO_URL"
            echo "✅ Saved background music to $OUTPUT_DIR/background-music.mp3"
            exit 0
        else
            echo "❌ No audio URL in response:"
            echo "$STATUS_RESPONSE"
            exit 1
        fi
    elif [ "$STATUS" = "failed" ]; then
        echo "❌ Music generation failed:"
        echo "$STATUS_RESPONSE"
        exit 1
    fi
done

echo "❌ Timed out waiting for music generation"
exit 1
