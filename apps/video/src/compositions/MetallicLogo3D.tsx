import { Canvas, } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import {
	AbsoluteFill,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
	random,
} from "remotion";
import { EffectComposer, Glitch } from "@react-three/postprocessing";
import { GlitchMode, } from "postprocessing";
import * as THREE from "three";

interface MetallicLogo3DProps {
	/** SVG path data for the logo */
	svgPath?: string;
	/** Scale of the logo */
	scale?: number;
}

// Simple 3D text/shape component with metallic material
const MetallicShape: React.FC<{
	rotation: number;
	scale: number;
}> = ({ rotation, scale }) => {
	const meshRef = useRef<THREE.Mesh>(null);

	// Create a simple box geometry as placeholder
	// In production, you'd extrude the SVG path
	const geometry = useMemo(() => {
		return new THREE.BoxGeometry(4, 1.2, 0.3);
	}, []);

	return (
		<mesh ref={meshRef} rotation={[0, (rotation * Math.PI) / 180, 0]} scale={scale}>
			<primitive object={geometry} attach="geometry" />
			<meshStandardMaterial
				color="#c0c0c0"
				metalness={0.85}
				roughness={0.2}
				envMapIntensity={1.2}
			/>
		</mesh>
	);
};

// Scene with lighting and effects
const Scene: React.FC<{
	rotation: number;
	scale: number;
	glitchSeed: number;
}> = ({ rotation, scale, glitchSeed }) => {
	// Use deterministic random for glitch timing
	const glitchDelay = useMemo(
		() => new THREE.Vector2(0.5 + random(glitchSeed) * 0.5, 1.0 + random(glitchSeed + 1) * 0.5),
		[glitchSeed],
	);
	const glitchDuration = useMemo(
		() => new THREE.Vector2(0.1 + random(glitchSeed + 2) * 0.1, 0.3 + random(glitchSeed + 3) * 0.2),
		[glitchSeed],
	);

	return (
		<>
			{/* Bright ambient light for silver appearance */}
			<ambientLight intensity={0.8} />

			{/* Key light - bright and white */}
			<directionalLight position={[5, 5, 5]} intensity={1.5} color="#ffffff" />

			{/* Fill light */}
			<directionalLight position={[-5, 3, 5]} intensity={0.8} color="#f0f0ff" />

			{/* Rim light for metallic edge highlights */}
			<directionalLight position={[0, -3, -5]} intensity={0.6} color="#ffffff" />

			{/* Top light for extra brightness */}
			<directionalLight position={[0, 10, 0]} intensity={0.5} color="#ffffff" />

			{/* Environment for reflections */}
			<hemisphereLight args={["#ffffff", "#e0e0e0", 0.6]} />

			<MetallicShape rotation={rotation} scale={scale} />

			{/* Glitch effect with deterministic parameters */}
			<EffectComposer>
				<Glitch
					delay={glitchDelay}
					duration={glitchDuration}
					strength={new THREE.Vector2(0.05, 0.1)}
					mode={GlitchMode.SPORADIC}
					active
					ratio={0.85}
				/>
			</EffectComposer>
		</>
	);
};

export const MetallicLogo3D: React.FC<MetallicLogo3DProps> = ({
	svgPath: _svgPath,
	scale = 0.6,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Oscillating rotation from -90 to 90 degrees, then reset to -90
	// Using a sawtooth wave pattern
	const cycleLength = fps * 3; // 3 seconds per cycle
	const cycleProgress = (frame % cycleLength) / cycleLength;
	const rotation = interpolate(cycleProgress, [0, 1], [-90, 90]);

	// Use frame as seed for deterministic glitch behavior
	const glitchSeed = Math.floor(frame / 30); // Change seed every 30 frames

	return (
		<AbsoluteFill
			style={{
				backgroundColor: "transparent",
			}}
		>
			<Canvas
				camera={{ position: [0, 0, 5], fov: 50 }}
				gl={{ 
					alpha: true, 
					preserveDrawingBuffer: true,
					antialias: true,
				}}
				style={{ background: "transparent" }}
			>
				<Scene rotation={rotation} scale={scale} glitchSeed={glitchSeed} />
			</Canvas>
		</AbsoluteFill>
	);
};
