import { FastifyReply, FastifyRequest } from "fastify";


export const getAll = (req: FastifyRequest, reply: FastifyReply) => {
	reply.send([]);
};