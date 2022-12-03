import fs from "fs";

if (!fs.existsSync("./config.json")) {
	console.log("No config.json!");
	process.exit(0);
}

const configFile = fs.readFileSync("./config.json");
const config = JSON.parse(configFile); // If it's not valid then we dont give a fuck, just crash it!

if (!(!config.uploader && config.uploadKey || !config.figlet && config.figletDefault || !config.audio && config.vkTTSVoice)) {
	console.log("Nothing to do!");
	process.exit(0);
}
fs.cpSync("./config.json", "./config.v1.json");

if (config.uploadKey) {
	config.masterKey = config.uploadKey;
	config.uploadKey = undefined;

	config.uploader = {
		extensions: config.uploadExts,
		path: config.uploadDir,
		useHome: config.uploadHome
	}
	config.uploadExts = undefined;
	config.uploadDir = undefined;
	config.uploadHome = undefined;

	config.uploader.watermark = {
		enabled: config.uploadWatermark,
		url: config.uploadWatermarkUrl,
		size: config.uploadWatermarkSize,
		extensions: config.uploadWatermarkExts,
		maxLoad: config.uploadWatermarkLoad
	}
	for (const [k,v] of Object.entries(config)) if (k.startsWith("uploadWatermark")) config[k] = undefined;

	console.log("Migrated uploader settings!");
}

if (config.vkTTSVoice) {
	config.audio = {vkTTSVoice: config.vkTTSVoice}
	config.vkTTSVoice = undefined;

	console.log("Migrated audio settings!");
}

if (config.figletDefault) {
	config.figlet = {defaultFont: config.figletDefault};
	config.figletDefault = undefined;

	console.log("Migrated figlet settings!");
}

fs.writeFileSync("./config.json", JSON.stringify(config, null, "\t"));

console.log("Config migrated successfully!");