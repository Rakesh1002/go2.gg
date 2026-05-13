import { interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "./constants";

interface BackgroundGradientProps {
	variant?: "default" | "hero" | "dark" | "subtle";
	animateGlow?: boolean;
}

export const BackgroundGradient: React.FC<BackgroundGradientProps> = ({
	variant = "default",
	animateGlow = true,
}) => {
	const frame = useCurrentFrame();

	// Animate glow position
	const glowX = animateGlow
		? 50 + Math.sin(frame * 0.02) * 10
		: 50;
	const glowY = animateGlow
		? -20 + Math.cos(frame * 0.015) * 5
		: -20;

	const opacity = interpolate(frame, [0, 30], [0, 1], {
		extrapolateRight: "clamp",
	});

	if (variant === "dark") {
		return (
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `linear-gradient(180deg, ${BRAND.colors.warmBlack} 0%, #0a0a0a 100%)`,
					opacity,
				}}
			/>
		);
	}

	if (variant === "hero") {
		return (
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: BRAND.colors.white,
					opacity,
				}}
			>
				{/* Hero glow */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: `radial-gradient(ellipse 80% 50% at ${glowX}% ${glowY}%, ${BRAND.colors.coral}18, transparent)`,
					}}
				/>
				{/* Secondary glow */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						background: `radial-gradient(ellipse 60% 40% at ${100 - glowX}% 120%, ${BRAND.colors.orange}12, transparent)`,
					}}
				/>
			</div>
		);
	}

	if (variant === "subtle") {
		return (
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: BRAND.colors.peach,
					opacity,
				}}
			/>
		);
	}

	// Default
	return (
		<div
			style={{
				position: "absolute",
				inset: 0,
				background: BRAND.colors.white,
				opacity,
			}}
		>
			<div
				style={{
					position: "absolute",
					inset: 0,
					background: `radial-gradient(ellipse 100% 80% at ${glowX}% ${glowY}%, ${BRAND.colors.coral}10, transparent)`,
				}}
			/>
		</div>
	);
};
