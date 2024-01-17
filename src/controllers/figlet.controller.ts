import { FastifyReply, FastifyRequest } from "fastify";
import figlet, { Fonts } from "figlet";
import { config } from "../utils";

export const generate = (req: FastifyRequest<{
	Querystring: {
		text: string;
		font?: string;
		plain?: boolean;
	};
}>, reply: FastifyReply) => {
	const { text, font: unsanitizedFont, plain } = req.query;
	const { figlet: figletConfig } = config.getConfig();

	const font = (unsanitizedFont?.replace(/.?.(\/|\\)/gi, "") || figletConfig.font) as Fonts;

	if (!text) return reply.status(400).send({ error: "No text specified" });

	figlet.text(text, { font }, (err, text) => {
		if (err) {
			const { message } = err;

			if (err.message.includes("ENOENT: no such file or directory") && message.includes(`${font}.flf`)) return reply.status(404).send({
				error: `Font ${font} was not found!`,
				errorDetails: {
					fonts: figlet.fontsSync()
				}
			});

			return reply.status(500).send({
				error: "Unknown error!",
				errorDetails: message
			});
		}
		
		reply.send(plain ? text : { text, font });
	});
};