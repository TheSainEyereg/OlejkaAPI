import { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../utils/index.ts";

export const redir = (req: FastifyRequest<{
	Params: {
		id?: string;
	};
}>, reply: FastifyReply) => {
	const { id } = req.params;

	const { links } = config.getConfig();

	if (!id)
		return reply.redirect(links.default);

	const link = links.static[id];
	if (!link)
		return reply.status(404).send({ error: "Link not found" });

	return reply.redirect(link);
};