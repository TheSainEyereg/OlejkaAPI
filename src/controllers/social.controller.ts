import { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../utils";

export const getAll = (req: FastifyRequest, reply: FastifyReply) => {
	const { client: { country } } = req;
	const { social } = config.getConfig();

	reply.send(
		Object.values(social)
			.filter(({ except, only }) => (!only || country && only.includes(country)) && (!except || country && !except.includes(country)))
			.map(({ url, username, name, icon }) => ({ url, username, name, icon }))
	);
};