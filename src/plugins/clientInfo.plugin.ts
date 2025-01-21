import { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

interface ClientInfo {
	readonly ip: string | null;
	readonly country: string | null;

	// isValid(): this is ClientInfo & { ip: string; country: string };
	isValid(): boolean; // Fuck TS 5.5
	isFrom(country: string): boolean;
}

declare module "fastify" {
	interface FastifyRequest {
		client: ClientInfo;
	}
}

const plugin: FastifyPluginAsync = async (app) => {
	app.addHook("preHandler", async (
		req: FastifyRequest<{
			Headers: {
				"CF-IPCountry": string;
				"CF-Connecting-IP": string;
			};
		}>,
	) => {
		req.client = {
			ip: req.headers["cf-connecting-ip"] || null,
			country: req.headers["cf-ipcountry"] || null,

			isValid() {
				return typeof this.ip === "string" && typeof this.country === "string";
			},
			isFrom(country) {
				return this.country?.toLowerCase() === country.toLowerCase();
			},
		};
	});
};

export default fp(plugin);
