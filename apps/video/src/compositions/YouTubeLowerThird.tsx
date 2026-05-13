import {
	AbsoluteFill,
	Img,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from "remotion";

interface YouTubeLowerThirdProps {
	channelName: string;
	subscriberCount: string;
	avatarUrl: string;
}

export const YouTubeLowerThird: React.FC<YouTubeLowerThirdProps> = ({
	channelName,
	subscriberCount,
	avatarUrl,
}) => {
	const frame = useCurrentFrame();
	const { fps, durationInFrames } = useVideoConfig();

	// Animation timings
	const slideInDuration = fps * 0.5; // 0.5s slide in
	const buttonPressFrame = fps * 1.5; // Button press at 1.5s
	const _buttonReleaseDuration = fps * 0.3; // 0.3s for button release
	const fadeOutStart = durationInFrames - fps; // Fade out in last 1s

	// Slide in from bottom with ease-out
	const slideIn = interpolate(frame, [0, slideInDuration], [200, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
		easing: (t) => 1 - (1 - t) ** 3, // ease-out cubic
	});

	// Fade out
	const fadeOut = interpolate(
		frame,
		[fadeOutStart, durationInFrames],
		[1, 0],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
		},
	);

	// Button press animation (ease-out for pressing in)
	const buttonPressProgress = interpolate(
		frame,
		[buttonPressFrame, buttonPressFrame + 10],
		[0, 1],
		{
			extrapolateLeft: "clamp",
			extrapolateRight: "clamp",
			easing: (t) => 1 - (1 - t) ** 2, // ease-out
		},
	);

	// Button release with spring bounce
	const buttonBounce = spring({
		frame: frame - buttonPressFrame - 10,
		fps,
		config: {
			damping: 10,
			stiffness: 200,
			mass: 0.5,
		},
	});

	const isPressed = frame >= buttonPressFrame;
	const isReleased = frame >= buttonPressFrame + 10;

	// Button scale: press down, then bounce back
	let buttonScale = 1;
	if (isPressed && !isReleased) {
		buttonScale = interpolate(buttonPressProgress, [0, 1], [1, 0.95]);
	} else if (isReleased) {
		buttonScale = interpolate(buttonBounce, [0, 1], [0.95, 1]);
	}

	// Button text transition
	const showSubscribed = frame >= buttonPressFrame + 15;

	return (
		<AbsoluteFill
			style={{
				justifyContent: "flex-end",
				alignItems: "center",
				paddingBottom: 60,
			}}
		>
			<div
				style={{
					transform: `translateY(${slideIn}px)`,
					opacity: fadeOut,
					display: "flex",
					alignItems: "center",
					gap: 16,
					backgroundColor: "white",
					padding: "16px 24px",
					borderRadius: 12,
					boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
				}}
			>
				{/* Avatar */}
				<Img
					src={avatarUrl}
					style={{
						width: 56,
						height: 56,
						borderRadius: "50%",
						objectFit: "cover",
					}}
				/>

				{/* Channel info */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: 2,
					}}
				>
					<div
						style={{
							fontSize: 18,
							fontWeight: 600,
							color: "#0f0f0f",
							fontFamily: "Roboto, system-ui, sans-serif",
						}}
					>
						{channelName}
					</div>
					<div
						style={{
							fontSize: 14,
							color: "#606060",
							fontFamily: "Roboto, system-ui, sans-serif",
						}}
					>
						{subscriberCount}
					</div>
				</div>

				{/* Subscribe button */}
				<div
					style={{
						marginLeft: 16,
						padding: "10px 16px",
						backgroundColor: showSubscribed ? "#0f0f0f" : "#0f0f0f",
						borderRadius: 20,
						transform: `scale(${buttonScale})`,
						cursor: "pointer",
						minWidth: 100,
						textAlign: "center",
						transition: "background-color 0.1s",
					}}
				>
					<span
						style={{
							fontSize: 14,
							fontWeight: 500,
							color: "white",
							fontFamily: "Roboto, system-ui, sans-serif",
							letterSpacing: 0.5,
						}}
					>
						{showSubscribed ? "Subscribed" : "Subscribe"}
					</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};
