import fs from "fs";

let config, filePath;
const loadConfig = () => {
	if (fs.existsSync("./config.json")) {
		config = {error: "No config file found! Create one like GitHub example."};
	}
	try {
		config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
		filePath = (config.uploadHome ? os.homedir() : ".") + config.uploadDir + "/";
	} catch (e) {
		config = {
			error: "Config file is not valid! Please check your config file.",
			errorDetails: e.message
		}	
	}
	if (config.error) return console.error(config.error+" ("+config.errorDetails+")");
	console.log("Loaded config.json!");
}
loadConfig();

let fsout;
fs.watch("./config.json", (event,fn) => {
	if(!fsout) {
		fsout = true;
		setTimeout(_=>{
			loadConfig();
			fsout = false;
		}, 100)
	}
});

export {config, filePath}