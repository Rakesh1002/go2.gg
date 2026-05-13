import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND } from "./constants";

interface AnimatedTextProps {
	text: string;
	delay?: number;
	fontSize?: number;
	fontWeight?: number;
	color?: string;
	style?: "fade" | "slide" | "typewriter" | "word-by-word";
	align?: "left" | "center" | "right";
	maxWidth?: number;
	lineHeight?: number;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({
	text,
	delay = 0,
	fontSize = 48,
	fontWeight = 600,
	color = BRAND.colors.warmBlack,
	style = "fade",
	align = "center",
	maxWidth,
	lineHeight = 1.3,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const adjustedFrame = Math.max(0, frame - delay);

	if (style === "word-by-word") {
		const words = text.split(" ");
		return (
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					justifyContent:
						align === "center"
							? "center"
							: align === "right"
								? "flex-end"
								: "flex-start",
					gap: fontSize * 0.3,
					maxWidth,
					lineHeight,
				}}
			>
				{words.map((word, i) => {
					const wordDelay = i * 4; // 4 frames between each word
					const wordFrame = Math.max(0, adjustedFrame - wordDelay);

					const opacity = interpolate(wordFrame, [0, 10], [0, 1], {
						extrapolateRight: "clamp",
					});

					const y = interpolate(wordFrame, [0, 10], [20, 0], {
						extrapolateRight: "clamp",
					});

					return (
						<span
							// biome-ignore lint/suspicious/noArrayIndexKey: words may repeat; index disambiguates
							key={`${word}-${i}`}
							style={{
								fontSize,
								fontWeight,
								fontFamily: BRAND.fonts.sans,
								color,
								opacity,
								transform: `translateY(${y}px)`,
								display: "inline-block",
							}}
						>
							{word}
						</span>
					);
				})}
			</div>
		);
	}

	if (style === "typewriter") {
		const charsToShow = Math.floor(adjustedFrame / 1.5);
		const visibleText = text.slice(0, charsToShow);
		const showCursor = adjustedFrame % 30 < 15 && charsToShow < text.length;

		return (
			<span
				style={{
					fontSize,
					fontWeight,
					fontFamily: BRAND.fonts.mono,
					color,
					textAlign: align,
					maxWidth,
					lineHeight,
				}}
			>
				{visibleText}
				{showCursor && (
					<span style={{ opacity: 0.7, marginLeft: 2 }}>|</span>
				)}
			</span>
		);
	}

	// Fade or slide
	const springValue = spring({
		frame: adjustedFrame,
		fps,
		config: { damping: 15, stiffness: 80 },
	});

	const opacity = interpolate(adjustedFrame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});

	const translateY = style === "slide" ? interpolate(springValue, [0, 1], [40, 0]) : 0;

	return (
		<div
			style={{
				fontSize,
				fontWeight,
				fontFamily: BRAND.fonts.sans,
				color,
				opacity,
				transform: `translateY(${translateY}px)`,
				textAlign: align,
				maxWidth,
				lineHeight,
			}}
		>
			{text}
		</div>
	);
};
