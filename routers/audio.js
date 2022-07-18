import { Router } from "express";
const router = Router();


import scdl from "soundcloud-downloader";
import ytdl from "ytdl-core";
router.get("/yt/:id", async (req,res) => {
	const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${req.params.id}`);
	if (!info) return res.sendStatus(404);
	try {
		const stream = await ytdl(info.videoDetails.videoId, {filter: "audioonly", quality: "highestaudio"});

		// Create buffer array
		const buffer = [];

		//Get stream length
		const streamLength = await new Promise((resolve, reject) => {
			let length = 0;
			stream.on("data", chunk => {
				length += chunk.length;
				buffer.push(chunk);
			});
			stream.on("end", () => {
				resolve(length);
			});
			stream.on("error", reject);
		});

		const duration = streamLength;
		const start = req.query.start || 0;
		const end = req.query.end || duration;
		
		res.writeHead(200, {
			"Content-Type": "audio/mpeg",
			"Content-Length": (end - start),
			"Content-Range": `bytes ${start}-${end}/${duration}`,
			"Accept-Ranges": "bytes"
		});
		res.end(Buffer.concat(buffer.slice(start, end)));
	} catch (e) {
		console.log(e);
		res.sendStatus(500);
	}
})

router.get("/sc/:user/:track", async (req,res) => {
	const info = await scdl.getInfo(`https://soundcloud.com/${req.params.user}/${req.params.track}`);
	if (!info) return res.sendStatus(404);
	try {
		const stream = await scdl.download(info.permalink_url, config.SCClient);

		// Create buffer array
		const buffer = [];

		//Get stream length
		const streamLength = await new Promise((resolve, reject) => {
			let length = 0;
			stream.on("data", chunk => {
				length += chunk.length;
				buffer.push(chunk);
			});
			stream.on("end", () => {
				resolve(length);
			});
			stream.on("error", reject);
		});

		const duration = streamLength;
		const start = req.query.start || 0;
		const end = req.query.end || duration;

		res.writeHead(200, {
			"Content-Type": "audio/mpeg",
			"Content-Length": (end - start),
			"Content-Range": `bytes ${start}-${end}/${duration}`,
			"Accept-Ranges": "bytes"
		});
		res.end(Buffer.concat(buffer.slice(start, end)));

	} catch (e) {
		console.log(e);
		res.sendStatus(500);
	}
})


export default router;