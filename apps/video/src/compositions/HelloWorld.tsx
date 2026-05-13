import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

interface HelloWorldProps {
	titleText: string;
	titleColor: string;
}

export const HelloWorld: React.FC<HelloWorldProps> = ({
	titleText,
	titleColor,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const opacity = interpolate(frame, [0, 30], [0, 1], {
		extrapolateRight: "clamp",
	});

	const scale = spring({
		frame,
		fps,
		config: {
			damping: 200,
		},
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor: "white",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<div
				style={{
					opacity,
					transform: `scale(${scale})`,
					fontSize: 100,
					fontWeight: "bold",
					color: titleColor,
					fontFamily: "system-ui, sans-serif",
				}}
			>
				{titleText}
			</div>
		</AbsoluteFill>
	);
};
