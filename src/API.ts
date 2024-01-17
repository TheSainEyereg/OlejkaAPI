import { env } from "node:process";
import dotenv from "dotenv";
import Fastify from "fastify";
import ConfigManager from "./utils/ConfigManager";
import identity from "./plugins/identity.plugin";
import clientInfo from "./plugins/clientInfo.plugin";
import socialRouter from "./routes/social.router";

dotenv.config();

export default class API {
	readonly app = Fastify();
	readonly config = new ConfigManager("dynamic.toml");

	private async build() {
		const { app, config } = this;

		await config.loadConfig();

		await app.register(identity);
		await app.register(clientInfo);

		await app.register(socialRouter, { prefix: "/social" });
		// await app.register(uploaderRouter, { prefix: "/files" });
		// await app.register(figletRouter, { prefix: "/figlet" });
		// await app.register(discordRouter, { prefix: "/discord" });

		app.get("/", (req) =>`Olejka API v3 \n\nTime: ${req.time} \nLoad: ${req.load} ${req.apm.isValid() ? `\nFrom: ${req.apm.country} (${req.apm.ip.split(".")[0]})` : ""}`);
	}

	launch = () => this.build().then(() => this.app.listen({ port: Number(env.PORT) || 5050, host: "0.0.0.0" })).then(at => console.log("Server started at", at));
}

export const api = new API();