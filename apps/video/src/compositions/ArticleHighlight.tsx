import { useEffect, useRef, useState } from "react";
import {
	AbsoluteFill,
	Img,
	interpolate,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";
import rough from "roughjs";

/**
 * OCR data for text positions - in production, generate this with:
 * tesseract article.png output --tsv
 * Then parse the TSV to extract word positions
 */
interface TextPosition {
	text: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

interface ArticleHighlightProps {
	imageSrc: string;
	highlightWords: string[];
	/** OCR-detected text positions */
	textPositions?: TextPosition[];
}

// Default positions for demo - these match the article.svg layout
// In production, generate with: tesseract article.png output --tsv
const DEFAULT_TEXT_POSITIONS: TextPosition[] = [
	{ text: "government", x: 280, y: 130, width: 160, height: 28 },
	{ text: "shutdown", x: 450, y: 130, width: 130, height: 28 },
	{ text: "funding", x: 130, y: 165, width: 100, height: 28 },
	{ text: "lapses", x: 240, y: 165, width: 80, height: 28 },
];

export const ArticleHighlight: React.FC<ArticleHighlightProps> = ({
	imageSrc,
	highlightWords,
	textPositions = DEFAULT_TEXT_POSITIONS,
}) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [_highlightPaths, setHighlightPaths] = useState<string[]>([]);

	// Animation parameters
	const blurDuration = fps; // 1 second
	const highlightStartFrame = blurDuration;
	const highlightDuration = fps * 2; // 2 seconds per highlight group

	// Calculate blur amount (starts blurred, unblurs over 1 second)
	const blurAmount = interpolate(frame, [0, blurDuration], [15, 0], {
		extrapolateRight: "clamp",
	});

	// Calculate zoom (very subtle zoom from 1.0 to 1.05 over 5 seconds)
	const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.05], {
		extrapolateRight: "clamp",
	});

	// Calculate 3D rotation (subtle rotation from -7.5 to +7.5 degrees)
	const rotateY = interpolate(frame, [0, durationInFrames], [-7.5, 7.5], {
		extrapolateRight: "clamp",
	});
	const rotateX = interpolate(frame, [0, durationInFrames], [-3, 3], {
		extrapolateRight: "clamp",
	});

	// Find positions to highlight
	const positionsToHighlight = textPositions.filter((pos) =>
		highlightWords.some((word) =>
			pos.text.toLowerCase().includes(word.toLowerCase()),
		),
	);

	// Generate rough.js highlight paths deterministically
	useEffect(() => {
		if (!canvasRef.current) return;

		const canvas = canvasRef.current;
		const rc = rough.canvas(canvas);
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Group highlights by proximity (same line)
		const groups: TextPosition[][] = [];
		let currentGroup: TextPosition[] = [];

		for (const pos of positionsToHighlight) {
			if (
				currentGroup.length === 0 ||
				Math.abs(pos.y - currentGroup[0].y) < 10
			) {
				currentGroup.push(pos);
			} else {
				groups.push([...currentGroup]);
				currentGroup = [pos];
			}
		}
		if (currentGroup.length > 0) {
			groups.push(currentGroup);
		}

		// Draw highlights for each group
		const paths: string[] = [];
		for (let i = 0; i < groups.length; i++) {
			const group = groups[i];
			const minX = Math.min(...group.map((p) => p.x));
			const maxX = Math.max(...group.map((p) => p.x + p.width));
			const y = group[0].y;
			const avgHeight = group.reduce((a, p) => a + p.height, 0) / group.length;

			// Calculate animation progress for this group
			const groupStartFrame = highlightStartFrame + i * 30;
			const groupProgress = interpolate(
				frame,
				[groupStartFrame, groupStartFrame + highlightDuration],
				[0, 1],
				{ extrapolateLeft: "clamp", extrapolateRight: "clamp" },
			);

			if (groupProgress > 0) {
				const animatedWidth = (maxX - minX + 20) * groupProgress;

				// Use deterministic seed for rough.js
				rc.rectangle(minX - 10, y - 5, animatedWidth, avgHeight + 10, {
					fill: "rgba(255, 235, 59, 0.6)",
					fillStyle: "solid",
					stroke: "rgba(255, 193, 7, 0.8)",
					strokeWidth: 2,
					roughness: 1.5,
					seed: 42 + i, // Deterministic seed
				});
			}

			paths.push(`${minX},${y},${maxX - minX},${avgHeight}`);
		}

		setHighlightPaths(paths);
	}, [frame, positionsToHighlight, highlightStartFrame, highlightDuration]);

	// Image dimensions - assume 16:9 article screenshot
	const imageWidth = 800;
	const imageHeight = 600;

	return (
		<AbsoluteFill
			style={{
				backgroundColor: "white",
				justifyContent: "center",
				alignItems: "center",
				perspective: 1000,
			}}
		>
			<div
				style={{
					position: "relative",
					transform: `scale(${zoom}) rotateY(${rotateY}deg) rotateX(${rotateX}deg)`,
					transformStyle: "preserve-3d",
					filter: `blur(${blurAmount}px)`,
					boxShadow: "0 25px 80px rgba(0,0,0,0.15)",
					borderRadius: 8,
					overflow: "hidden",
				}}
			>
				{/* Article image */}
				<Img
					src={staticFile(imageSrc)}
					style={{
						width: imageWidth,
						height: imageHeight,
						objectFit: "contain",
						display: "block",
					}}
				/>

				{/* Canvas for rough.js highlights - positioned behind text */}
				<canvas
					ref={canvasRef}
					width={imageWidth}
					height={imageHeight}
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						pointerEvents: "none",
						mixBlendMode: "multiply",
					}}
				/>
			</div>
		</AbsoluteFill>
	);
};
