import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "./constants";

interface Go2LogoProps {
	size?: number;
	showWordmark?: boolean;
	animateIn?: boolean;
	animationDelay?: number;
}

export const Go2Logo: React.FC<Go2LogoProps> = ({
	size = 120,
	showWordmark = true,
	animateIn = true,
	animationDelay = 0,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const adjustedFrame = Math.max(0, frame - animationDelay);

	const scaleSpring = animateIn
		? spring({
				frame: adjustedFrame,
				fps,
				config: { damping: 12, stiffness: 100, mass: 0.8 },
			})
		: 1;

	const opacity = animateIn
		? interpolate(adjustedFrame, [0, 15], [0, 1], {
				extrapolateRight: "clamp",
			})
		: 1;

	const wordmarkOpacity = animateIn
		? interpolate(adjustedFrame, [10, 25], [0, 1], {
				extrapolateRight: "clamp",
			})
		: 1;

	const wordmarkSlide = animateIn
		? interpolate(adjustedFrame, [10, 30], [-20, 0], {
				extrapolateRight: "clamp",
			})
		: 0;

	const iconSize = size * 0.8;
	const wordmarkSize = size * 0.5;

	return (
		<div
			style={{
				display: "flex",
				alignItems: "center",
				gap: size * 0.15,
				transform: `scale(${scaleSpring})`,
				opacity,
			}}
		>
			{/* Icon */}
			<svg
				width={iconSize}
				height={iconSize}
				viewBox="0 0 32 32"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				role="img"
				aria-labelledby="go2-logo-title"
			>
				<title id="go2-logo-title">Go2 logo</title>
				<defs>
					<linearGradient
						id="brand-gradient"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor={BRAND.colors.coral} />
						<stop offset="100%" stopColor={BRAND.colors.orange} />
					</linearGradient>
				</defs>
				<rect
					x="2"
					y="2"
					width="28"
					height="28"
					rx="6"
					fill="url(#brand-gradient)"
				/>
				<path
					d="M11 21L21 11"
					stroke="#FFFFFF"
					strokeWidth="3"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M13 11H21V19"
					stroke="#FFFFFF"
					strokeWidth="3"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>

			{/* Wordmark */}
			{showWordmark && (
				<span
					style={{
						fontSize: wordmarkSize,
						fontWeight: 700,
						fontFamily: BRAND.fonts.sans,
						color: BRAND.colors.warmBlack,
						opacity: wordmarkOpacity,
						transform: `translateX(${wordmarkSlide}px)`,
					}}
				>
					Go2
				</span>
			)}
		</div>
	);
};
