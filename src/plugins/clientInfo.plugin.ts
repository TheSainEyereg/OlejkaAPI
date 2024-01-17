import { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

interface APM {
	readonly ip: string | null;
	readonly country: string | null;

	isValid(): this is {
		ip: string;
		country: string;
	};
	isFrom(country: string): boolean;
}

declare module "fastify" {
	interface FastifyRequest {
		apm: APM;
	}
}

const plugin: FastifyPluginAsync = async (app) => {
	app.addHook("preHandler", async (req: FastifyRequest<{
		Headers: {
			"CF-IPCountry": string;
			"CF-Connecting-IP": string;
		};
	}>) => {
		req.apm = {
			ip: req.headers["cf-connecting-ip"] || null,
			country: req.headers["cf-ipcountry"] || null,
			
			isValid() {
				return this.ip !== null && this.country !== null;
			},
			isFrom(country) {
				return this.country?.toLowerCase() === country.toLowerCase();
			}
		};
	});
};

export default fp(plugin);