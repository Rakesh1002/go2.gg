import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND, SCENES } from "../constants";
import { AnimatedText } from "../AnimatedText";
import { BackgroundGradient } from "../BackgroundGradient";

export const ProblemScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { start, end } = SCENES.problem;

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

	// Pain points appear sequentially
	const painPoints = [
		{ text: "Slow redirects", icon: "🐌" },
		{ text: "Lost clicks", icon: "📉" },
		{ text: "Frustrated users", icon: "😤" },
		{ text: "Missed opportunities", icon: "💸" },
	];

	return (
		<AbsoluteFill style={{ opacity }}>
			<BackgroundGradient variant="subtle" />

			<AbsoluteFill
				style={{
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					gap: 60,
					padding: 100,
				}}
			>
				{/* Problem headline */}
				<AnimatedText
					text="Every millisecond matters."
					delay={10}
					fontSize={56}
					fontWeight={700}
					style="slide"
					color={BRAND.colors.warmBlack}
				/>

				{/* Pain points grid */}
				<div
					style={{
						display: "flex",
						gap: 40,
						marginTop: 20,
					}}
				>
					{painPoints.map((point, i) => {
						const pointDelay = 30 + i * 20;
						const pointOpacity = interpolate(
							sceneFrame,
							[pointDelay, pointDelay + 15],
							[0, 1],
							{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
						);
						const pointScale = interpolate(
							sceneFrame,
							[pointDelay, pointDelay + 15],
							[0.8, 1],
							{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
						);

						return (
							<div
								key={point.text}
								style={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									gap: 12,
									opacity: pointOpacity,
									transform: `scale(${pointScale})`,
								}}
							>
								<span style={{ fontSize: 48 }}>{point.icon}</span>
								<span
									style={{
										fontSize: 20,
										fontWeight: 500,
										fontFamily: BRAND.fonts.sans,
										color: BRAND.colors.warmGray,
									}}
								>
									{point.text}
								</span>
							</div>
						);
					})}
				</div>

				{/* Transition text */}
				<div
					style={{
						marginTop: 40,
						opacity: interpolate(sceneFrame, [100, 120], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}),
					}}
				>
					<AnimatedText
						text="There's a better way."
						delay={100}
						fontSize={32}
						fontWeight={500}
						color={BRAND.colors.coral}
					/>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
