import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND, SCENES } from "../constants";
import { AnimatedText } from "../AnimatedText";
import { BackgroundGradient } from "../BackgroundGradient";

export const HookScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { start, end } = SCENES.hook;

	// Only render during this scene
	const isActive = frame >= start && frame < end;
	if (!isActive) return null;

	const sceneFrame = frame - start;

	// Scene fade out
	const fadeOut = interpolate(sceneFrame, [end - start - 20, end - start], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<AbsoluteFill style={{ opacity: fadeOut }}>
			<BackgroundGradient variant="hero" />

			<AbsoluteFill
				style={{
					justifyContent: "center",
					alignItems: "center",
					padding: 100,
				}}
			>
				{/* Main hook text */}
				<AnimatedText
					text="What if your links loaded before your users could blink?"
					delay={15}
					fontSize={64}
					fontWeight={700}
					style="word-by-word"
					align="center"
					maxWidth={1200}
					lineHeight={1.2}
				/>

				{/* Subtle speedometer visual */}
				<div
					style={{
						position: "absolute",
						bottom: 120,
						display: "flex",
						alignItems: "center",
						gap: 12,
						opacity: interpolate(sceneFrame, [50, 70], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}),
					}}
				>
					<div
						style={{
							width: 12,
							height: 12,
							borderRadius: "50%",
							background: BRAND.colors.success,
							boxShadow: `0 0 12px ${BRAND.colors.success}`,
						}}
					/>
					<span
						style={{
							fontSize: 24,
							fontFamily: BRAND.fonts.mono,
							color: BRAND.colors.warmGray,
						}}
					>
						{"<10ms response time"}
					</span>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
