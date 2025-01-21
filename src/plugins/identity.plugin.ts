import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";


declare module "fastify" {
	interface FastifyRequest {
		time: number;
		load: number;
	}
}

const plugin: FastifyPluginAsync = async (app) => {
	app.addHook("preHandler", async (req, reply) => {
		reply.header("Olejka-Service", "APIv3");
		reply.header("System-Time", req.time = Date.now());
		reply.header("System-Load", req.load = Deno.loadavg()[0]);
	});
};

export default fp(plugin);