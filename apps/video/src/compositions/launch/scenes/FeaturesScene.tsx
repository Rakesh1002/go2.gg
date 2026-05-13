import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND, FEATURES, SCENES } from "../constants";
import { FeatureCard } from "../FeatureCard";
import { BackgroundGradient } from "../BackgroundGradient";
import { AnimatedText } from "../AnimatedText";

export const FeaturesScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { start, end } = SCENES.features;

	const isActive = frame >= start && frame < end;
	if (!isActive) return null;

	const sceneFrame = frame - start;
	const sceneDuration = end - start;

	// Scene transitions
	const fadeIn = interpolate(sceneFrame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(sceneFrame, [sceneDuration - 20, sceneDuration], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const opacity = Math.min(fadeIn, fadeOut);

	// Headline
	const headlineOpacity = interpolate(sceneFrame, [0, 30], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ opacity }}>
			<BackgroundGradient variant="subtle" />

			<AbsoluteFill
				style={{
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					gap: 60,
					padding: 80,
				}}
			>
				{/* Section headline */}
				<div style={{ opacity: headlineOpacity }}>
					<AnimatedText
						text="Everything you need. Nothing you don't."
						fontSize={48}
						fontWeight={700}
						color={BRAND.colors.warmBlack}
						style="fade"
					/>
				</div>

				{/* Feature cards grid */}
				<div
					style={{
						display: "flex",
						gap: 32,
						justifyContent: "center",
						flexWrap: "wrap",
						maxWidth: 1400,
					}}
				>
					{FEATURES.map((feature, i) => (
						<FeatureCard
							key={feature.title}
							title={feature.title}
							description={feature.description}
							icon={feature.icon}
							delay={40 + i * 25}
							index={i}
						/>
					))}
				</div>

				{/* Additional feature highlights */}
				<div
					style={{
						display: "flex",
						gap: 48,
						marginTop: 20,
						opacity: interpolate(sceneFrame, [200, 230], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}),
					}}
				>
					{[
						"QR Codes",
						"UTM Builder",
						"A/B Testing",
						"Webhooks",
						"Password Protection",
					].map((feature, _i) => (
						<div
							key={feature}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 8,
							}}
						>
							<svg
								width="20"
								height="20"
								viewBox="0 0 20 20"
								fill="none"
							role="img"
									aria-label="Check"
								>
									<title>Check</title>
								<path
									d="M16.667 5L7.5 14.167 3.333 10"
									stroke={BRAND.colors.success}
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
							<span
								style={{
									fontSize: 18,
									fontWeight: 500,
									fontFamily: BRAND.fonts.sans,
									color: BRAND.colors.warmGray,
								}}
							>
								{feature}
							</span>
						</div>
					))}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
