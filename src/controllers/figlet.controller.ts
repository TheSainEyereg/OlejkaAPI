import { FastifyReply, FastifyRequest } from "fastify";
// @ts-types="npm:@types/figlet"
import figlet, { Fonts } from "figlet";
import { config } from "../utils/index.ts";

const getFonts = () =>
	new Promise((res, rej) =>
		figlet.fonts((err, fonts) => err ? rej(err) : res(fonts || []))
	) as Promise<Fonts[]>;

const getText = (text: string, font: Fonts) =>
	new Promise((res, rej) =>
		figlet.text(text, { font }, (err, text) => err ? rej(err) : res(text || ""))
	);

export const generate = async (
	req: FastifyRequest<{
		Querystring: {
			text: string;
			font?: string;
			plain?: boolean;
		};
	}>,
	reply: FastifyReply,
) => {
	const { text: textString, font: fontString, plain } = req.query;
	const { figlet: figletConfig } = config.getConfig();

	const font = (fontString || figletConfig.font) as Fonts;

	if (!textString) {
		return reply.status(400).send({ error: "No text specified" });
	}

	const fonts = await getFonts();

	if (!fonts.includes(font)) {
		return reply.status(404).send({
			error: `Font ${font} was not found!`,
			errorDetails: {
				fonts,
			},
		});
	}

	const text = await getText(textString, font);

	return plain ? text : { text, font };
};
