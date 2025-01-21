import { parse } from "@std/toml";

interface ConfigFile {
	[key: string]: unknown;
	max_load?: number;
	master_key: string;
	url: string;
	uploader?: {
		path: string;
		extensions?: string[];
		watermark?: {
			max_load?: number;
			url: string;
			extensions: string[];
			size: {
				mult: number;
				max: number;
				min: number;
			};
		};
	};
	figlet?: {
		font?: string;
	};
	social?: {
		[key: string]: {
			url: string;
			username?: string;
			name?: string;
			icon?: string;

			only?: string[];
			except?: string[];
		};
	};
	links?: {
		default: string;
		[key: string]: string;
	};
}

interface Config {
	maxLoad: number;
	masterKey: string;
	url: string;

	uploader?: {
		path: string;
		extensions?: string[];
		watermark?: {
			maxLoad: number;
			url: string;
			extensions: string[];
			size: {
				mult: number;
				max: number;
				min: number;
			};
		};
	};

	figlet: {
		font: string;
	};

	social: {
		[key: string]: {
			url: string;
			username?: string;
			name?: string;
			icon?: string;

			only?: string[];
			except?: string[];
		};
	};

	links: {
		default: string;
		static: Record<string, string>;
	};
}

export default class ConfigManager {
	private config: Config | null = null;
	private path: string;

	constructor(path: string) {
		this.path = Deno.realPathSync(path);
	}

	async loadConfig() {
		const file = await Deno.readTextFile(this.path);
		const content = parse(file) as ConfigFile;

		const { master_key: masterKey, url, max_load, uploader, figlet, social, links } = content;
		if (!masterKey) throw new Error("Missing master key");
		if (!url) throw new Error("Missing API url");

		const config: Config = {
			masterKey,
			url,
			maxLoad: max_load || 1,

			figlet: {
				font: figlet?.font || "Big",
			},

			social: {},

			links: {
				default: "",
				static: {},
			},
		};

		if (uploader) {
			const { path, extensions, watermark } = uploader;
			if (!path) throw new Error("Missing uploader path");

			config.uploader = {
				path,
				extensions,
			};

			if (watermark) {
				const { max_load, url, extensions, size } = watermark;
				if (!url) throw new Error("Missing watermark url");
				if (!extensions.length) throw new Error("Missing watermark extensions");
				if (!size?.mult || !size?.max || !size?.min) throw new Error("Missing watermark size");

				config.uploader.watermark = {
					maxLoad: max_load || config.maxLoad,
					url,
					extensions,
					size
				};
			}
		}

		if (social) {
			for (const [key, value] of Object.entries(social)) {
				const { url } = value;

				if (!url) throw new Error(`Missing social url for ${key}`);

				config.social[key] = value;
			}
		}

		if (links) {
			config.links.default = links.default || "";

			for (const [key, value] of Object.entries(links)) {
				if (key !== "default") {
					config.links.static[key] = value;
				}
			}
		}

		this.config = config;
	}

	watchConfig = async () => {
		const watcher = Deno.watchFs(this.path);
		console.log("Watching config file at", this.path);
		for await (const event of watcher) {
			if (event.kind !== "modify") continue;

			try {
				await this.loadConfig();
				console.log("Successfully updated config");
			} catch (error) {
				console.error("Error parsing config file", error);
				continue;
			}
		}
	};
	
	getConfig = () => this.config!;
}