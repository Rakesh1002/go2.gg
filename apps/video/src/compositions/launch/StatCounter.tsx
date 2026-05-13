import { interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "./constants";

interface StatCounterProps {
	value: string;
	label: string;
	delay?: number;
	countUp?: boolean;
}

export const StatCounter: React.FC<StatCounterProps> = ({
	value,
	label,
	delay = 0,
	countUp = true,
}) => {
	const frame = useCurrentFrame();
	const adjustedFrame = Math.max(0, frame - delay);

	const opacity = interpolate(adjustedFrame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});

	const scale = interpolate(adjustedFrame, [0, 20], [0.9, 1], {
		extrapolateRight: "clamp",
	});

	// Extract numeric part for count-up animation
	let displayValue = value;
	if (countUp) {
		const numMatch = value.match(/(\d+)/);
		if (numMatch) {
			const targetNum = Number.parseInt(numMatch[1], 10);
			const progress = interpolate(adjustedFrame, [0, 45], [0, 1], {
				extrapolateRight: "clamp",
			});
			const currentNum = Math.floor(targetNum * progress);
			displayValue = value.replace(/\d+/, currentNum.toString());
		}
	}

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: 8,
				opacity,
				transform: `scale(${scale})`,
			}}
		>
			<span
				style={{
					fontSize: 72,
					fontWeight: 700,
					fontFamily: BRAND.fonts.sans,
					background: BRAND.gradient,
					WebkitBackgroundClip: "text",
					WebkitTextFillColor: "transparent",
					backgroundClip: "text",
				}}
			>
				{displayValue}
			</span>
			<span
				style={{
					fontSize: 20,
					fontWeight: 500,
					fontFamily: BRAND.fonts.sans,
					color: BRAND.colors.warmGray,
					textTransform: "uppercase",
					letterSpacing: 2,
				}}
			>
				{label}
			</span>
		</div>
	);
};
