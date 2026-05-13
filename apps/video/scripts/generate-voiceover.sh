#!/bin/bash
# Generate voiceover using Gemini 2.5 Flash TTS
# Usage: ./scripts/generate-voiceover.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../public/launch"
mkdir -p "$OUTPUT_DIR"

# Get API key from environment or use the one from .env
GEMINI_API_KEY="${GEMINI_API_KEY:-}"

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY not set. Please set it or pass it as environment variable."
    echo "   export GEMINI_API_KEY='your-api-key'"
    exit 1
fi

echo "🎙️ Generating voiceover with Gemini 2.5 Flash TTS..."

# The voiceover script with director's notes
read -r -d '' VOICEOVER_PROMPT << 'EOF'
# AUDIO PROFILE: Marcus V.
## "The Tech Visionary"

## THE SCENE: Professional Recording Studio
A pristine, acoustically perfect studio with warm lighting. Marcus stands confidently at the microphone, delivering a product announcement for a cutting-edge tech startup. The energy is focused, authoritative, and inspiring.

### DIRECTOR'S NOTES
Style: Deep, authoritative male voice with warmth and confidence. Professional but not corporate - think a tech visionary sharing an exciting breakthrough. Slight enthusiasm that builds through the piece.

Pacing: Measured and deliberate on key stats and numbers. Slightly faster during excitement moments. Strategic pauses for emphasis after major claims.

Accent: Standard American English, clear articulation, broadcast quality.

### TRANSCRIPT
What if your links loaded before your users could blink?

Every millisecond matters. Slow redirects mean lost clicks, frustrated users, and missed opportunities.

Introducing Go2 — the edge-native link platform built for speed.

Sub-ten millisecond redirects. Real-time analytics. Custom domains. A developer API that actually makes sense.

Built on Cloudflare's edge network. Three hundred ten locations worldwide. Ninety-nine point nine nine percent uptime. Zero cold starts.

Your links deserve to be instant. Start free at go2 dot gg.
EOF

# Escape the prompt for JSON
ESCAPED_PROMPT=$(echo "$VOICEOVER_PROMPT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

# Make API request
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"contents\": [{\"parts\":[{\"text\": $ESCAPED_PROMPT}]}],
    \"generationConfig\": {
      \"responseModalities\": [\"AUDIO\"],
      \"speechConfig\": {
        \"voiceConfig\": {
          \"prebuiltVoiceConfig\": {
            \"voiceName\": \"Orus\"
          }
        }
      }
    }
  }" | jq -r '.candidates[0].content.parts[0].inlineData.data' | base64 --decode > "$OUTPUT_DIR/voiceover.pcm"

echo "✅ Generated PCM audio"

# Convert PCM to WAV using ffmpeg
if command -v ffmpeg &> /dev/null; then
    ffmpeg -y -f s16le -ar 24000 -ac 1 -i "$OUTPUT_DIR/voiceover.pcm" "$OUTPUT_DIR/voiceover.wav" 2>/dev/null
    rm "$OUTPUT_DIR/voiceover.pcm"
    echo "✅ Converted to WAV: $OUTPUT_DIR/voiceover.wav"
    
    # Also convert to MP3 for Remotion
    ffmpeg -y -i "$OUTPUT_DIR/voiceover.wav" -codec:a libmp3lame -qscale:a 2 "$OUTPUT_DIR/voiceover.mp3" 2>/dev/null
    echo "✅ Converted to MP3: $OUTPUT_DIR/voiceover.mp3"
else
    echo "⚠️ ffmpeg not found. PCM file saved. Convert manually:"
    echo "   ffmpeg -f s16le -ar 24000 -ac 1 -i $OUTPUT_DIR/voiceover.pcm $OUTPUT_DIR/voiceover.wav"
fi

echo ""
echo "🎉 Voiceover generation complete!"
