import "@std/dotenv/load";
import Fastify from "fastify";

import { config } from "./utils/index.ts";

import identity from "./plugins/identity.plugin.ts";
import clientInfo from "./plugins/clientInfo.plugin.ts";

import socialRouter from "./routes/social.router.ts";
import figletRouter from "./routes/figlet.router.ts";
import linksRouter from "./routes/links.router.ts";

const app = Fastify();

async function build() {
	await config.loadConfig();

	await app.register(identity);
	await app.register(clientInfo);

	await app.register(socialRouter, { prefix: "/social" });
	// await app.register(uploaderRouter, { prefix: "/files" });
	await app.register(linksRouter, { prefix: "/links" });
	await app.register(figletRouter, { prefix: "/figlet" });
	// await app.register(discordRouter, { prefix: "/discord" });

	app.get(
		"/",
		(req) =>
			`Olejka API v3 (Deno ${Deno.version.deno}) \n\nTime: ${req.time} \nLoad: ${req.load} ${
				req.client.isValid()
					? `\nFrom: ${req.client.country!} (${req.client.ip!.split(/\.|:/)[0]})`
					: ""
			}`,
	);
}

build()
	.then(() => app.listen({ port: Number(Deno.env.get("PORT")) || 5050, host: "0.0.0.0" }))
	.then((at) => console.log("Server started at", at))
	.then(config.watchConfig);
