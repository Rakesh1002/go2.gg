import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND, SCENES, STATS } from "../constants";
import { StatCounter } from "../StatCounter";
import { BackgroundGradient } from "../BackgroundGradient";

export const StatsScene: React.FC = () => {
	const frame = useCurrentFrame();
	const { start, end } = SCENES.stats;

	const isActive = frame >= start && frame < end;
	if (!isActive) return null;

	const sceneFrame = frame - start;
	const sceneDuration = end - start;

	// Scene transitions
	const fadeIn = interpolate(sceneFrame, [0, 20], [0, 1], {
		extrapolateRight: "clamp",
	});
	const fadeOut = interpolate(sceneFrame, [sceneDuration - 20, sceneDuration], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const opacity = Math.min(fadeIn, fadeOut);

	const stats = [
		{ value: STATS.redirectTime, label: "Redirect Time" },
		{ value: STATS.edgeLocations, label: "Edge Locations" },
		{ value: STATS.uptime, label: "Uptime SLA" },
		{ value: STATS.linksShortened, label: "Links Shortened" },
	];

	return (
		<AbsoluteFill style={{ opacity }}>
			<BackgroundGradient variant="dark" />

			<AbsoluteFill
				style={{
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					gap: 80,
					padding: 100,
				}}
			>
				{/* Section headline */}
				<div
					style={{
						opacity: interpolate(sceneFrame, [0, 30], [0, 1], {
							extrapolateRight: "clamp",
						}),
					}}
				>
					<span
						style={{
							fontSize: 42,
							fontWeight: 700,
							fontFamily: BRAND.fonts.sans,
							color: BRAND.colors.white,
						}}
					>
						Built for scale. Proven by numbers.
					</span>
				</div>

				{/* Stats grid */}
				<div
					style={{
						display: "flex",
						gap: 100,
						justifyContent: "center",
					}}
				>
					{stats.map((stat, i) => (
						<StatCounter
							key={stat.label}
							value={stat.value}
							label={stat.label}
							delay={30 + i * 15}
						/>
					))}
				</div>

				{/* Trust badges */}
				<div
					style={{
						display: "flex",
						gap: 48,
						alignItems: "center",
						opacity: interpolate(sceneFrame, [120, 150], [0, 1], {
							extrapolateLeft: "clamp",
							extrapolateRight: "clamp",
						}),
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
							padding: "12px 24px",
							backgroundColor: "rgba(255,255,255,0.1)",
							borderRadius: BRAND.radius.md,
						}}
					>
						<span style={{ fontSize: 20 }}>☁️</span>
						<span
							style={{
								fontSize: 16,
								fontWeight: 500,
								fontFamily: BRAND.fonts.sans,
								color: BRAND.colors.white,
							}}
						>
							Cloudflare Workers
						</span>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
							padding: "12px 24px",
							backgroundColor: "rgba(255,255,255,0.1)",
							borderRadius: BRAND.radius.md,
						}}
					>
						<span style={{ fontSize: 20 }}>🔒</span>
						<span
							style={{
								fontSize: 16,
								fontWeight: 500,
								fontFamily: BRAND.fonts.sans,
								color: BRAND.colors.white,
							}}
						>
							Zero Cold Starts
						</span>
					</div>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 12,
							padding: "12px 24px",
							backgroundColor: "rgba(255,255,255,0.1)",
							borderRadius: BRAND.radius.md,
						}}
					>
						<span style={{ fontSize: 20 }}>🌍</span>
						<span
							style={{
								fontSize: 16,
								fontWeight: 500,
								fontFamily: BRAND.fonts.sans,
								color: BRAND.colors.white,
							}}
						>
							Global Edge Network
						</span>
					</div>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
