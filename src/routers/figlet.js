import { Router } from "express";
import { config } from "../components/config.js";
const router = Router();


import figlet from "figlet";

router.get("/", async(req,res) => {
	const text = req.query.text
	const font = req.query.font?.replace(/.?.(\/|\\)/gi, "") || config.figlet?.defaultFont || "Big";
	
	if (!text) return res.status(400).json({error: "No text specified"});

	figlet.text(text, {font}, (err, data) => {
		if (err) {
			if (err.message.includes("ENOENT: no such file or directory") && err.message.includes(`${font}.flf`)) return res.status(404).json({
				error: `Font ${font} was not found!`,
				errorDetails: {
					fonts: figlet.fontsSync()
				}
			});
			return res.status(500).json({
				error: "Unknown error!",
				errorDetails: err.message
			});
		}

		res.json({
			text: data,
			font: font
		});
	})
})


export default router;