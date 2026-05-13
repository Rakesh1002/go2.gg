import { Config } from "@remotion/cli/config";

// Default settings for standard video rendering
// Override with CLI flags for transparent videos
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
