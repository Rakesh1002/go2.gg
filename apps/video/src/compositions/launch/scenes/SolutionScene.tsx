import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, SCENES } from "../constants";
import { Go2Logo } from "../Go2Logo";
import { AnimatedText } from "../AnimatedText";
import { BackgroundGradient } from "../BackgroundGradient";

export const SolutionScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const { start, end } = SCENES.solution;

	const isActive = frame >= start && frame < end;
	if (!isActive) return null;

	const sceneFrame = frame - start;

	// Scene transitions
	const fadeIn = interpolate(sceneFrame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(sceneFrame, [end - start - 20, end - start], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const opacity = Math.min(fadeIn, fadeOut);

	// Logo entrance with dramatic scale
	const logoScale = spring({
		frame: sceneFrame - 10,
		fps,
		config: { damping: 8, stiffness: 80, mass: 1 },
	});

	// Tagline reveal
	const taglineOpacity = interpolate(sceneFrame, [50, 70], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	// Edge-native badge
	const badgeOpacity = interpolate(sceneFrame, [80, 100], [0, 1], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ opacity }}>
			<BackgroundGradient variant="hero" />

			<AbsoluteFill
				style={{
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					gap: 40,
				}}
			>
				{/* Introducing text */}
				<div
					style={{
						opacity: interpolate(sceneFrame, [0, 20], [0, 1], {
							extrapolateRight: "clamp",
						}),
						transform: `translateY(${interpolate(sceneFrame, [0, 20], [20, 0], {
							extrapolateRight: "clamp",
						})}px)`,
					}}
				>
					<span
						style={{
							fontSize: 24,
							fontWeight: 500,
							fontFamily: BRAND.fonts.sans,
							color: BRAND.colors.warmGray,
							textTransform: "uppercase",
							letterSpacing: 4,
						}}
					>
						Introducing
					</span>
				</div>

				{/* Logo */}
				<div
					style={{
						transform: `scale(${Math.max(0, logoScale) * 2})`,
					}}
				>
					<Go2Logo size={180} animateIn={false} />
				</div>

				{/* Tagline */}
				<div style={{ opacity: taglineOpacity, marginTop: 20 }}>
					<AnimatedText
						text="The edge-native link platform built for speed."
						delay={0}
						fontSize={36}
						fontWeight={500}
						color={BRAND.colors.warmGray}
						style="fade"
					/>
				</div>

				{/* Edge-native badge */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 16,
						padding: "16px 32px",
						backgroundColor: BRAND.colors.warmBlack,
						borderRadius: BRAND.radius.lg,
						opacity: badgeOpacity,
						transform: `translateY(${interpolate(sceneFrame, [80, 100], [20, 0], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						})}px)`,
					}}
				>
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none" role="img" aria-label="Lightning"><title>Lightning</title>
						<path
							d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
							stroke={BRAND.colors.coral}
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
					<span
						style={{
							fontSize: 18,
							fontWeight: 600,
							fontFamily: BRAND.fonts.sans,
							color: BRAND.colors.white,
						}}
					>
						Powered by Cloudflare's Edge Network
					</span>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
