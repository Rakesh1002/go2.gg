#!/bin/bash
# Generate voiceover using Vertex AI Gemini TTS
# Usage: ./scripts/generate-voiceover-vertex.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/../public/launch"
mkdir -p "$OUTPUT_DIR"

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-namemyapp}"
LOCATION="${GCP_LOCATION:-us-central1}"
MODEL="gemini-2.5-flash-preview-tts"

# Get access token - try gcloud first, then use provided key
if command -v gcloud &> /dev/null; then
    ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null || echo "")
fi

if [ -z "$ACCESS_TOKEN" ]; then
    # Use the Vertex AI API key if gcloud not available
    ACCESS_TOKEN="${VERTEX_AI_API_KEY:-}"
fi

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ No access token available."
    echo "   Either run 'gcloud auth login' or set VERTEX_AI_API_KEY"
    exit 1
fi

echo "🎙️ Generating voiceover with Vertex AI Gemini TTS..."
echo "   Project: $PROJECT_ID"
echo "   Location: $LOCATION"

# The voiceover script with director's notes
VOICEOVER_PROMPT='# AUDIO PROFILE: Marcus V.
## "The Tech Visionary"

## THE SCENE: Professional Recording Studio
A pristine, acoustically perfect studio with warm lighting. Marcus stands confidently at the microphone, delivering a product announcement for a cutting-edge tech startup. The energy is focused, authoritative, and inspiring.

### DIRECTOR'"'"'s NOTES
Style: Deep, authoritative male voice with warmth and confidence. Professional but not corporate - think a tech visionary sharing an exciting breakthrough. Slight enthusiasm that builds through the piece.

Pacing: Measured and deliberate on key stats and numbers. Slightly faster during excitement moments. Strategic pauses for emphasis after major claims.

Accent: Standard American English, clear articulation, broadcast quality.

### TRANSCRIPT
What if your links loaded before your users could blink?

Every millisecond matters. Slow redirects mean lost clicks, frustrated users, and missed opportunities.

Introducing Go2 — the edge-native link platform built for speed.

Sub-ten millisecond redirects. Real-time analytics. Custom domains. A developer API that actually makes sense.

Built on Cloudflare'"'"'s edge network. Three hundred ten locations worldwide. Ninety-nine point nine nine percent uptime. Zero cold starts.

Your links deserve to be instant. Start free at go2 dot gg.'

# Escape for JSON
ESCAPED_PROMPT=$(echo "$VOICEOVER_PROMPT" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')

# Make API request to Vertex AI
ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent"

echo "📡 Calling: $ENDPOINT"

RESPONSE=$(curl -s -X POST "$ENDPOINT" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
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
  }")

# Check for errors
if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
    echo "❌ API Error:"
    echo "$RESPONSE" | jq '.error'
    exit 1
fi

# Extract audio data
AUDIO_DATA=$(echo "$RESPONSE" | jq -r '.candidates[0].content.parts[0].inlineData.data // empty')

if [ -z "$AUDIO_DATA" ]; then
    echo "❌ No audio data in response"
    echo "Response:"
    echo "$RESPONSE" | head -c 500
    exit 1
fi

# Save and convert
echo "$AUDIO_DATA" | base64 --decode > "$OUTPUT_DIR/voiceover.pcm"
echo "✅ Generated PCM audio"

# Convert PCM to WAV and MP3 using ffmpeg
if command -v ffmpeg &> /dev/null; then
    ffmpeg -y -f s16le -ar 24000 -ac 1 -i "$OUTPUT_DIR/voiceover.pcm" "$OUTPUT_DIR/voiceover.wav" 2>/dev/null
    rm "$OUTPUT_DIR/voiceover.pcm"
    echo "✅ Converted to WAV: $OUTPUT_DIR/voiceover.wav"
    
    ffmpeg -y -i "$OUTPUT_DIR/voiceover.wav" -codec:a libmp3lame -qscale:a 2 "$OUTPUT_DIR/voiceover.mp3" 2>/dev/null
    echo "✅ Converted to MP3: $OUTPUT_DIR/voiceover.mp3"
else
    echo "⚠️ ffmpeg not found. PCM file saved."
fi

echo ""
echo "🎉 Voiceover generation complete!"
