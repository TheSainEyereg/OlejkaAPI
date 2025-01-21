import { FastifyPluginAsync } from "fastify";
import { generate } from "../controllers/figlet.controller.ts";

const router: FastifyPluginAsync = async (app) => {
	app.get("/", generate);
};

export default router;
