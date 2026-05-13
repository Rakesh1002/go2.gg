import { AbsoluteFill, Audio, staticFile, interpolate, useCurrentFrame } from "remotion";
import {
	HookScene,
	ProblemScene,
	SolutionScene,
	FeaturesScene,
	StatsScene,
	CTAScene,
} from "./scenes";
import { TOTAL_FRAMES } from "./constants";

/**
 * Go2.gg Product Launch Video
 *
 * Structure (AIDA Framework):
 * - Hook (0-3s): Attention - Bold opening question
 * - Problem (3-8s): Interest - Pain points
 * - Solution (8-13s): Desire begins - Introduce Go2
 * - Features (13-28s): Desire deepens - Show key features
 * - Stats (28-35s): Social proof - Numbers that matter
 * - CTA (35-40s): Action - Clear call to action
 *
 * Total: 40 seconds at 30fps = 1200 frames
 */

interface Go2ProductLaunchProps {
	showVoiceover?: boolean;
	showBGM?: boolean;
}

export const Go2ProductLaunch: React.FC<Go2ProductLaunchProps> = ({
	showVoiceover = true,
	showBGM = true,
}) => {
	const frame = useCurrentFrame();

	// BGM volume: fade in at start, fade out at end
	const bgmVolume = interpolate(
		frame,
		[0, 30, TOTAL_FRAMES - 60, TOTAL_FRAMES],
		[0, 0.25, 0.25, 0],
		{ extrapolateLeft: "clamp", extrapolateRight: "clamp" }
	);

	return (
		<AbsoluteFill
			style={{
				backgroundColor: "#FFFFFF",
			}}
		>
			{/* All scenes render based on current frame */}
			<HookScene />
			<ProblemScene />
			<SolutionScene />
			<FeaturesScene />
			<StatsScene />
			<CTAScene />

			{/* Background music with fade in/out */}
			{showBGM && (
				<Audio
					src={staticFile("launch/background-music.mp3")}
					volume={bgmVolume}
				/>
			)}

			{/* Voiceover */}
			{showVoiceover && (
				<Audio
					src={staticFile("launch/voiceover.mp3")}
					volume={1}
				/>
			)}
		</AbsoluteFill>
	);
};
