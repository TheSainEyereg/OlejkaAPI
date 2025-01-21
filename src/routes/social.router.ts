import { FastifyPluginAsync } from "fastify";
import { getAll } from "../controllers/social.controller.ts";

const router: FastifyPluginAsync = async (app) => {
	app.get("/", getAll);
};

export default router;