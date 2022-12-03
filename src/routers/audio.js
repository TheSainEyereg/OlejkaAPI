import { Router } from "express";
import { config } from "../components/config.js";

const router = Router();


import fetch from "node-fetch"
const vkModels = ["maria", "pavel", "katherine"];
router.get("/vk-tts", async (req, res) => {
	const text = req.query.text;
	if (!text) return res.status(400).json({error: "No text for TTS provided!"});

	const voice = req.query.voice || config.audio?.vkTTSVoice || "pavel";
	if (!vkModels.includes(voice)) return res.status(400).json({error: `Voice model ${voice} is not available!`, errorDetails: {models: vkModels}});

	const tempo = req.query.tempo || 1;
	if ((tempo > 2) || (tempo < 0.5)) return res.status(400).json({error: `Voice tempo is incorrect!`, errorDetails: "Tempo param should be between 0.5 and 2!"});

	try {
		const vkRes = await fetch(`https://mcs.mail.ru/tts_demo?encoder=mp3&tempo=${tempo}&model_name=${voice}`, {
			method: "POST",
			body: text
		});

		const buffer = await vkRes.arrayBuffer();

		res.writeHead(200, {
			"Content-Type": "audio/mp3",
			"Content-Length": buffer.byteLength,
			"accept-ranges": "bytes"
		})

		res.end(Buffer.from(buffer));
	} catch (e) {
		console.log(e);
		res.status(500).json({error: "Error in TTS", errorDetails: e});
	}
})


export default router;