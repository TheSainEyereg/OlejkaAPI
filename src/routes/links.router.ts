import { FastifyPluginAsync } from "fastify";
import { redir } from "../controllers/links.controller";

const router: FastifyPluginAsync = async (app) => {
	app.get("/", redir);
	app.get("/:id", redir);
};

export default router;