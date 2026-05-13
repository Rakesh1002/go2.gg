import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "./constants";

interface FeatureCardProps {
	title: string;
	description: string;
	icon: string;
	delay?: number;
	index?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
	title,
	description,
	icon,
	delay = 0,
	index = 0,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const adjustedFrame = Math.max(0, frame - delay);

	const springValue = spring({
		frame: adjustedFrame,
		fps,
		config: { damping: 12, stiffness: 100, mass: 0.8 },
	});

	const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
		extrapolateRight: "clamp",
	});

	const scale = interpolate(springValue, [0, 1], [0.8, 1]);
	const translateY = interpolate(springValue, [0, 1], [30, 0]);

	// Subtle floating animation after entrance
	const floatOffset =
		adjustedFrame > 30
			? Math.sin((adjustedFrame - 30) * 0.05 + index * 0.5) * 3
			: 0;

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 16,
				padding: 32,
				backgroundColor: BRAND.colors.white,
				borderRadius: BRAND.radius.lg,
				boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
				border: "1px solid rgba(0,0,0,0.06)",
				opacity,
				transform: `scale(${scale}) translateY(${translateY + floatOffset}px)`,
				width: 280,
			}}
		>
			{/* Icon */}
			<div
				style={{
					fontSize: 48,
					width: 80,
					height: 80,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: BRAND.gradient,
					borderRadius: BRAND.radius.md,
					boxShadow: `0 4px 16px ${BRAND.colors.coral}40`,
				}}
			>
				<span style={{ filter: "grayscale(1) brightness(10)" }}>{icon}</span>
			</div>

			{/* Title */}
			<h3
				style={{
					fontSize: 24,
					fontWeight: 700,
					fontFamily: BRAND.fonts.sans,
					color: BRAND.colors.warmBlack,
					margin: 0,
					textAlign: "center",
				}}
			>
				{title}
			</h3>

			{/* Description */}
			<p
				style={{
					fontSize: 16,
					fontWeight: 400,
					fontFamily: BRAND.fonts.sans,
					color: BRAND.colors.warmGray,
					margin: 0,
					textAlign: "center",
					lineHeight: 1.5,
				}}
			>
				{description}
			</p>
		</div>
	);
};
