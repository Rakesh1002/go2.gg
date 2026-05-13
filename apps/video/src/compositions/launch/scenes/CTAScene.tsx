import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND, SCENES } from "../constants";
import { Go2Logo } from "../Go2Logo";
import { CTAButton } from "../CTAButton";
import { BackgroundGradient } from "../BackgroundGradient";

export const CTAScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { start, end } = SCENES.cta;

	const isActive = frame >= start && frame < end;
	if (!isActive) return null;

	const sceneFrame = frame - start;

	// Scene fade in (no fade out - end of video)
	const fadeIn = interpolate(sceneFrame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ opacity: fadeIn }}>
			<BackgroundGradient variant="hero" />

			<AbsoluteFill
				style={{
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					gap: 48,
				}}
			>
				{/* Logo */}
				<Go2Logo size={140} animateIn animationDelay={10} />

				{/* Headline */}
				<div
					style={{
						opacity: interpolate(sceneFrame, [30, 50], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}),
						transform: `translateY(${interpolate(sceneFrame, [30, 50], [20, 0], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						})}px)`,
					}}
				>
					<span
						style={{
							fontSize: 56,
							fontWeight: 700,
							fontFamily: BRAND.fonts.sans,
							color: BRAND.colors.warmBlack,
						}}
					>
						Your links deserve to be instant.
					</span>
				</div>

				{/* Subheadline */}
				<div
					style={{
						opacity: interpolate(sceneFrame, [50, 70], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}),
					}}
				>
					<span
						style={{
							fontSize: 28,
							fontWeight: 400,
							fontFamily: BRAND.fonts.sans,
							color: BRAND.colors.warmGray,
						}}
					>
						Start free. No credit card required.
					</span>
				</div>

				{/* CTA Button */}
				<CTAButton text="Start Free at go2.gg" delay={70} size="large" />

				{/* Pricing hint */}
				<div
					style={{
						display: "flex",
						gap: 32,
						marginTop: 20,
						opacity: interpolate(sceneFrame, [90, 110], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}),
					}}
				>
					<span
						style={{
							fontSize: 18,
							fontFamily: BRAND.fonts.sans,
							color: BRAND.colors.warmGray,
						}}
					>
						Free tier available
					</span>
					<span style={{ color: BRAND.colors.warmGray }}>•</span>
					<span
						style={{
							fontSize: 18,
							fontFamily: BRAND.fonts.sans,
							color: BRAND.colors.warmGray,
						}}
					>
						Pro from $9/month
					</span>
					<span style={{ color: BRAND.colors.warmGray }}>•</span>
					<span
						style={{
							fontSize: 18,
							fontFamily: BRAND.fonts.sans,
							color: BRAND.colors.warmGray,
						}}
					>
						14-day trial
					</span>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
