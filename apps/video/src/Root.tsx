import { Composition } from "remotion";
import { HelloWorld } from "./compositions/HelloWorld";
import { LinkPreview } from "./compositions/LinkPreview";
import { ArticleHighlight } from "./compositions/ArticleHighlight";
import { YouTubeLowerThird } from "./compositions/YouTubeLowerThird";
import { MetallicLogo3D } from "./compositions/MetallicLogo3D";
import { Go2ProductLaunch, TOTAL_FRAMES, VIDEO_CONFIG } from "./compositions/launch";

// Remotion 4.x typings drift from the workspace @types/react; cast each
// component prop with `as any` to bridge.

export const RemotionRoot: React.FC = () => {
	return (
		<>
			{/* Original demo compositions */}
			<Composition
				id="HelloWorld"
				component={HelloWorld as any}
				durationInFrames={150}
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					titleText: "Welcome to go2.gg",
					titleColor: "#000000",
				}}
			/>
			<Composition
				id="LinkPreview"
				component={LinkPreview as any}
				durationInFrames={90}
				fps={30}
				width={1200}
				height={630}
				defaultProps={{
					url: "go2.gg/demo",
					title: "Check out this link!",
					clicks: 1234,
				}}
			/>

			{/* Task 1: Article with 3D rotation, blur, and rough.js highlights */}
			<Composition
				id="ArticleHighlight"
				component={ArticleHighlight as any}
				durationInFrames={150} // 5 seconds at 30fps
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					imageSrc: "article.svg",
					highlightWords: ["government", "shutdown", "funding", "lapses"],
				}}
			/>

			{/* Task 2: YouTube lower third with subscribe animation */}
			<Composition
				id="YouTubeLowerThird"
				component={YouTubeLowerThird as any}
				durationInFrames={150} // 5 seconds at 30fps
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					channelName: "Remotion",
					subscriberCount: "2.34K subscribers",
					avatarUrl:
						"https://yt3.googleusercontent.com/U1odzKpyZw7s4kcP0O1LwLXqmvoho1jqVxZ7EABsT8IRIEuzTF4Vwu-cdq3387GmzmQq9Fxhi4c=s160-c-k-c0x00ffffff-no-rj",
				}}
			/>

			{/* Task 3: 3D metallic SVG logo with glitch effect */}
			<Composition
				id="MetallicLogo3D"
				component={MetallicLogo3D as any}
				durationInFrames={180} // 6 seconds at 30fps
				fps={30}
				width={1920}
				height={1080}
				defaultProps={{
					scale: 0.6,
				}}
			/>

			{/* Go2.gg Product Launch Video - 40 seconds */}
			<Composition
				id="Go2ProductLaunch"
				component={Go2ProductLaunch as any}
				durationInFrames={TOTAL_FRAMES}
				fps={VIDEO_CONFIG.fps}
				width={VIDEO_CONFIG.width}
				height={VIDEO_CONFIG.height}
				defaultProps={{
					showVoiceover: true,
					showBGM: true,
				}}
			/>

			{/* Go2.gg Product Launch Video - No Audio (for preview) */}
			<Composition
				id="Go2ProductLaunchSilent"
				component={Go2ProductLaunch as any}
				durationInFrames={TOTAL_FRAMES}
				fps={VIDEO_CONFIG.fps}
				width={VIDEO_CONFIG.width}
				height={VIDEO_CONFIG.height}
				defaultProps={{
					showVoiceover: false,
					showBGM: false,
				}}
			/>
		</>
	);
};
