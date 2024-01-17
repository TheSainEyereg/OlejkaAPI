import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import os from "node:os";

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
		reply.header("System-Load", req.load = os.loadavg()[0] / os.cpus().length);
	});
};

export default fp(plugin);