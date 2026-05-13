// Go2.gg Brand Constants
export const BRAND = {
	colors: {
		coral: "#E85B4F",
		orange: "#E99B6C",
		peach: "#FDF8F6",
		white: "#FFFFFF",
		warmBlack: "#1A1A1A",
		warmGray: "#666666",
		success: "#22B573",
		info: "#5B8AD4",
	},
	gradient: "linear-gradient(135deg, #E85B4F 0%, #E99B6C 100%)",
	fonts: {
		sans: "Geist Sans, system-ui, -apple-system, sans-serif",
		mono: "Geist Mono, monospace",
	},
	radius: {
		sm: 6,
		md: 10,
		lg: 16,
		xl: 24,
	},
} as const;

// Video Configuration
export const VIDEO_CONFIG = {
	fps: 30,
	width: 1920,
	height: 1080,
} as const;

// Scene Timings (in frames at 30fps)
export const SCENES = {
	// Opening Hook (0-3s) - Attention
	hook: { start: 0, end: 90 },
	// Problem Statement (3-8s) - Interest
	problem: { start: 90, end: 240 },
	// Solution Intro (8-13s) - Desire begins
	solution: { start: 240, end: 390 },
	// Feature Showcase (13-28s) - Desire deepens
	features: { start: 390, end: 840 },
	// Social Proof / Stats (28-35s)
	stats: { start: 840, end: 1050 },
	// Call to Action (35-40s) - Action
	cta: { start: 1050, end: 1200 },
} as const;

// Total duration: 40 seconds at 30fps = 1200 frames
export const TOTAL_FRAMES = 1200;

// Key Stats
export const STATS = {
	redirectTime: "<10ms",
	edgeLocations: "310+",
	uptime: "99.99%",
	linksShortened: "50M+",
} as const;

// Features to showcase
export const FEATURES = [
	{
		title: "Lightning Fast",
		description: "Sub-10ms redirects from 310+ edge locations",
		icon: "⚡",
	},
	{
		title: "Real-Time Analytics",
		description: "Track clicks, locations, devices instantly",
		icon: "📊",
	},
	{
		title: "Custom Domains",
		description: "Your brand, your links, automatic SSL",
		icon: "🔗",
	},
	{
		title: "Developer-First API",
		description: "TypeScript, Python, Go SDKs included",
		icon: "🛠️",
	},
] as const;

// Voiceover Script (for timing reference)
export const VOICEOVER_SCRIPT = {
	hook: "What if your links loaded before your users could blink?",
	problem:
		"Every millisecond matters. Slow redirects mean lost clicks, frustrated users, and missed opportunities.",
	solution:
		"Introducing Go2 — the edge-native link platform built for speed.",
	features:
		"Sub-10ms redirects. Real-time analytics. Custom domains. A developer API that actually makes sense.",
	stats: "Built on Cloudflare's edge network. 310 locations. 99.99% uptime. Zero cold starts.",
	cta: "Start free at go2.gg. Your links deserve to be instant.",
} as const;
