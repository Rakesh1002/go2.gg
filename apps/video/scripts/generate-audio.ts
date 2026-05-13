/**
 * Generate voiceover and background music for Go2 Product Launch Video
 * 
 * Usage: npx tsx scripts/generate-audio.ts
 * 
 * Requires:
 * - GEMINI_API_KEY environment variable for Gemini TTS
 * - AUDIOPOD_AI_API_KEY environment variable for background music
 */

import * as fs from "fs";
import * as path from "path";

// API Keys from environment or hardcoded for this project
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyXXXXXXXXXXXXXXX"; // Replace with actual key
const AUDIOPOD_API_KEY = process.env.AUDIOPOD_AI_API_KEY || "ap_vCi4UvDD4MrPSdezkke4LmI3pgBG7VhDZfh7Kb58cBU";

const OUTPUT_DIR = path.join(__dirname, "../public/launch");

// Voiceover script with director's notes for Gemini TTS
const VOICEOVER_PROMPT = `
# AUDIO PROFILE: Marcus V.
## "The Tech Visionary"

## THE SCENE: Professional Recording Studio
A pristine, acoustically perfect studio with warm lighting. Marcus stands confidently 
at the microphone, delivering a product announcement for a cutting-edge tech startup.
The energy is focused, authoritative, and inspiring.

### DIRECTOR'S NOTES
Style: Deep, authoritative male voice with warmth and confidence. Professional but 
not corporate - think a tech visionary sharing an exciting breakthrough. Slight 
enthusiasm that builds through the piece.

Pacing: Measured and deliberate on key stats and numbers. Slightly faster during 
excitement moments. Strategic pauses for emphasis after major claims.

Accent: Standard American English, clear articulation, broadcast quality.

Breathing: Natural breaths between sentences. No rushed delivery.

### TRANSCRIPT
What if your links loaded before your users could blink?

Every millisecond matters. Slow redirects mean lost clicks, frustrated users, 
and missed opportunities.

Introducing Go2 — the edge-native link platform built for speed.

Sub-ten millisecond redirects. Real-time analytics. Custom domains. 
A developer API that actually makes sense.

Built on Cloudflare's edge network. Three hundred ten locations worldwide. 
Ninety-nine point nine nine percent uptime. Zero cold starts.

Your links deserve to be instant. Start free at go2 dot gg.
`;

// Background music prompt for AudioPod
const BGM_PROMPT = {
	prompt: "Modern tech product launch music, inspiring corporate background, subtle electronic elements, building momentum, cinematic underscore, professional and innovative feel, soft synth pads, gentle percussion, uplifting but not overpowering",
	duration: 45, // 45 seconds to cover the 40s video with fade out
	genre_preset: "edm", // Electronic base
};

async function generateVoiceover(): Promise<void> {
	console.log("🎙️ Generating voiceover with Gemini 2.5 Flash TTS...");

	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${GEMINI_API_KEY}`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				contents: [
					{
						parts: [{ text: VOICEOVER_PROMPT }],
					},
				],
				generationConfig: {
					responseModalities: ["AUDIO"],
					speechConfig: {
						voiceConfig: {
							prebuiltVoiceConfig: {
								voiceName: "Orus", // Firm, authoritative male voice
							},
						},
					},
				},
			}),
		}
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Gemini TTS API error: ${response.status} - ${error}`);
	}

	const data = await response.json();
	const audioBase64 = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

	if (!audioBase64) {
		throw new Error("No audio data in response");
	}

	// Decode base64 to buffer
	const audioBuffer = Buffer.from(audioBase64, "base64");

	// Save as PCM first, then we'll convert
	const pcmPath = path.join(OUTPUT_DIR, "voiceover.pcm");
	const wavPath = path.join(OUTPUT_DIR, "voiceover.wav");

	fs.writeFileSync(pcmPath, audioBuffer);
	console.log(`✅ Saved PCM to ${pcmPath}`);

	// Convert PCM to WAV using ffmpeg (must be installed)
	const { execSync } = await import("child_process");
	try {
		execSync(`ffmpeg -y -f s16le -ar 24000 -ac 1 -i "${pcmPath}" "${wavPath}"`, {
			stdio: "inherit",
		});
		console.log(`✅ Converted to WAV: ${wavPath}`);
		// Clean up PCM
		fs.unlinkSync(pcmPath);
	} catch (e) {
		console.log("⚠️ ffmpeg conversion failed. PCM file saved. Convert manually:");
		console.log(`   ffmpeg -f s16le -ar 24000 -ac 1 -i "${pcmPath}" "${wavPath}"`);
	}
}

async function generateBackgroundMusic(): Promise<void> {
	console.log("🎵 Generating background music with AudioPod AI...");

	// Start music generation job
	const response = await fetch("https://api.audiopod.ai/v1/music/instrumental", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"X-API-Key": AUDIOPOD_API_KEY,
		},
		body: JSON.stringify({
			prompt: BGM_PROMPT.prompt,
			duration: BGM_PROMPT.duration,
			output_format: "mp3",
		}),
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`AudioPod API error: ${response.status} - ${error}`);
	}

	const jobData = await response.json();
	const jobId = jobData.job_id;
	console.log(`📋 Job started: ${jobId}`);

	// Poll for completion
	let completed = false;
	let audioUrl = "";
	let attempts = 0;
	const maxAttempts = 60; // 5 minutes max

	while (!completed && attempts < maxAttempts) {
		await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
		attempts++;

		const statusResponse = await fetch(
			`https://api.audiopod.ai/v1/music/jobs/${jobId}`,
			{
				headers: {
					"X-API-Key": AUDIOPOD_API_KEY,
				},
			}
		);

		const statusData = await statusResponse.json();
		console.log(`⏳ Status: ${statusData.status} (attempt ${attempts}/${maxAttempts})`);

		if (statusData.status === "completed") {
			completed = true;
			audioUrl = statusData.output_url || statusData.audio_url;
		} else if (statusData.status === "failed") {
			throw new Error(`Music generation failed: ${statusData.error}`);
		}
	}

	if (!completed) {
		throw new Error("Music generation timed out");
	}

	// Download the audio file
	console.log(`⬇️ Downloading from ${audioUrl}...`);
	const audioResponse = await fetch(audioUrl);
	const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

	const outputPath = path.join(OUTPUT_DIR, "background-music.mp3");
	fs.writeFileSync(outputPath, audioBuffer);
	console.log(`✅ Saved background music to ${outputPath}`);
}

async function main() {
	// Ensure output directory exists
	if (!fs.existsSync(OUTPUT_DIR)) {
		fs.mkdirSync(OUTPUT_DIR, { recursive: true });
	}

	console.log("🚀 Starting audio generation for Go2 Product Launch Video\n");

	try {
		// Generate voiceover
		await generateVoiceover();
		console.log("");

		// Generate background music
		await generateBackgroundMusic();
		console.log("");

		console.log("🎉 All audio generated successfully!");
		console.log("\nNext steps:");
		console.log("1. Update Go2ProductLaunch.tsx to include Audio components");
		console.log("2. Run: pnpm render:launch");
	} catch (error) {
		console.error("❌ Error:", error);
		process.exit(1);
	}
}

main();
