import { FastifyReply, FastifyRequest } from "fastify";
import { config } from "../utils/index.ts";

export const getAll = (req: FastifyRequest, reply: FastifyReply) => {
	const { client: { country } } = req;
	const { social } = config.getConfig();

	reply.header("Access-Control-Allow-Origin", "*");

	reply.send(
		Object.entries(social)
			.filter(([, { except, only }]) =>
				(!only || country && only.includes(country)) &&
				(!except || country && !except.includes(country))
			)
			.map(([id, { url, username, name }]) => ({ id, url, username, name })),
	);
};
