import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "./constants";

interface CTAButtonProps {
	text: string;
	delay?: number;
	size?: "default" | "large";
	pulse?: boolean;
}

export const CTAButton: React.FC<CTAButtonProps> = ({
	text,
	delay = 0,
	size = "default",
	pulse = true,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const adjustedFrame = Math.max(0, frame - delay);

	const springValue = spring({
		frame: adjustedFrame,
		fps,
		config: { damping: 10, stiffness: 120, mass: 0.8 },
	});

	const opacity = interpolate(adjustedFrame, [0, 15], [0, 1], {
		extrapolateRight: "clamp",
	});

	const scale = interpolate(springValue, [0, 1], [0.8, 1]);

	// Pulse animation after entrance
	const pulseScale = pulse && adjustedFrame > 30
		? 1 + Math.sin(adjustedFrame * 0.1) * 0.02
		: 1;

	// Glow pulse
	const glowOpacity = pulse && adjustedFrame > 30
		? 0.3 + Math.sin(adjustedFrame * 0.08) * 0.15
		: 0.3;

	const padding = size === "large" ? "24px 64px" : "18px 48px";
	const fontSize = size === "large" ? 28 : 22;

	return (
		<div
			style={{
				display: "inline-flex",
				opacity,
				transform: `scale(${scale * pulseScale})`,
			}}
		>
			<div
				style={{
					position: "relative",
				}}
			>
				{/* Glow effect */}
				<div
					style={{
						position: "absolute",
						inset: -4,
						background: BRAND.gradient,
						borderRadius: BRAND.radius.xl + 4,
						filter: "blur(16px)",
						opacity: glowOpacity,
					}}
				/>

				{/* Button */}
				<div
					style={{
						position: "relative",
						padding,
						background: BRAND.gradient,
						borderRadius: BRAND.radius.xl,
						boxShadow: `0 4px 24px ${BRAND.colors.coral}40`,
					}}
				>
					<span
						style={{
							fontSize,
							fontWeight: 600,
							fontFamily: BRAND.fonts.sans,
							color: BRAND.colors.white,
							letterSpacing: 0.5,
						}}
					>
						{text}
					</span>
				</div>
			</div>
		</div>
	);
};
