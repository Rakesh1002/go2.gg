import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

interface LinkPreviewProps {
	url: string;
	title: string;
	clicks: number;
}

export const LinkPreview: React.FC<LinkPreviewProps> = ({
	url,
	title,
	clicks,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const slideIn = spring({
		frame,
		fps,
		config: {
			damping: 200,
		},
	});

	const countUp = Math.floor(
		interpolate(frame, [30, 70], [0, clicks], {
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		}),
	);

	return (
		<AbsoluteFill
			style={{
				background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
				justifyContent: "center",
				alignItems: "center",
				padding: 60,
			}}
		>
			<div
				style={{
					backgroundColor: "white",
					borderRadius: 24,
					padding: 48,
					boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
					transform: `translateY(${interpolate(slideIn, [0, 1], [100, 0])}px)`,
					opacity: slideIn,
					width: "100%",
					maxWidth: 900,
				}}
			>
				<div
					style={{
						fontSize: 28,
						color: "#6366f1",
						fontWeight: 600,
						marginBottom: 16,
						fontFamily: "system-ui, sans-serif",
					}}
				>
					go2.gg
				</div>
				<div
					style={{
						fontSize: 48,
						fontWeight: "bold",
						color: "#1f2937",
						marginBottom: 24,
						fontFamily: "system-ui, sans-serif",
					}}
				>
					{title}
				</div>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 32,
					}}
				>
					<div
						style={{
							backgroundColor: "#f3f4f6",
							padding: "12px 24px",
							borderRadius: 12,
							fontSize: 24,
							color: "#4b5563",
							fontFamily: "monospace",
						}}
					>
						{url}
					</div>
					<div
						style={{
							fontSize: 32,
							fontWeight: "bold",
							color: "#10b981",
							fontFamily: "system-ui, sans-serif",
						}}
					>
						{countUp.toLocaleString()} clicks
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
