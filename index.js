const os = require("os");
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");

process.on("unhandledRejection", e => {console.error(e)});

let config, filePath;
const loadConfig = () => {
	if (fs.existsSync("./config.json")) {
		config = {error: "No config file found! Create one like GitHub example."};
	}
	try {
		config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
		filePath = (config.uploadHome ? os.homedir() : ".") + config.uploadDir + "/";
	} catch (e) {
		config = {
			error: "Config file is not valid! Please check your config file.",
			errorDetails: e.message
		}	
	}
	if (config.error) return console.error(config.error+" ("+config.errorDetails+")");
	console.log("Loaded config.json!");
}
loadConfig();

let fsout;
fs.watch("./config.json", (event,fn) => {
	if(!fsout) {
		fsout = 1;
		setTimeout(_=>{
			loadConfig();
			fsout=0;
		}, 100)
	}
});


const app = express();
app.listen(config.port || 5050, e => {
	if (e) {console.error(e); return process.exit(1)}
	console.log("Server started at http://127.0.0.1:" + (config.port || 5050 + "/"));
});

let load, time;
app.use((req, res, next) => {
	res.setHeader("Olejka-Service", "APIv2");
	res.setHeader("Content-Type", "application/json");
	res.setHeader("System-Load", load = os.loadavg()[0] / os.cpus().length);
	res.setHeader("System-Time", time = new Date().getTime());
	if (config.error) return res.status(500).json(config);
	if (load > config.maxLoad) return res.sendStatus(503)
	next()
});

app.get("/", cors(), (req,res) => res.setHeader("Content-Type", "text/plain").send(`Olejka API v2\n\nTime: ${time}\nLoad: ${load}`));


/*   ~~~   AUDIO   ~~~   */
const scdl = require("soundcloud-downloader").default;
const ytdl = require("ytdl-core");
app.get("/audio/yt/:id", async (req,res) => {
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

app.get("/audio/sc/:user/:track", async (req,res) => {
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

/*   ~~~   FILES   ~~~   */
const crypto = require("crypto");

const multer = require("multer"); // Parser for multipart/form-data
const upload = multer({storage: multer.memoryStorage()});
app.post("/files/upload/", upload.single("file") ,async (req,res) => {
	if (!fs.existsSync(filePath)) fs.mkdirSync(filePath);

	if (!req.headers["content-length"]) return res.status(400).json({error: "Content-length header should be specified!"});
	if (parseInt(req.headers["content-length"]) < 53) return res.status(400).json({error: "Content-length is too small!"});

	if (!req.headers["content-type"]?.includes("multipart/form-data")) return res.status(400).json({error: "Invalid content-type! Body not a multipart form-data!"});

	if (!req.body.key) return res.status(401).json({error: "No upload key provided!"});
	if (req.body.key !== config.uploadKey) return res.status(403).json({error: "Wrong upload key!"});

	if (!req.file) return res.status(406).json({error: "No file provided!"});

	const file = req.file;
	const ext= path.extname(file.originalname);
	if (!config.uploadExts.includes(ext.slice(1))) return res.status(415).json({error: "File format is not allowed!"});
	const md5sum = crypto.createHash("md5").update(file.buffer).digest();
	const filename = md5sum.toString("hex").slice(-10)+ext;
	if (!fs.existsSync(filePath+filename)) fs.writeFileSync(filePath+filename, file.buffer);
	const md5stamp = crypto.createHash("md5").update(fs.statSync(filePath+filename).birthtime.getTime().toString()).digest("base64url");
	res.json({
		filename: filename,
		original: file.originalname,
		get: `/files/get/${filename}`,
		delete: `/files/delete/${filename}/${md5sum.toString("base64url").slice(7,13)+crypto.randomBytes(1).toString("base64url")+md5stamp.slice(8,16)}`
	})
}, async (e, req, res, next) => {
	switch (e.toString()) {
		case "Error: Unexpected end of multipart data":
			console.log("Unexpected end of multipart data (wrong Content-Length?)");
			return res.status(400).json({error: "Unexpected end of multipart data (wrong Content-Length?)"});
		default:
			console.log("Unknown error: "+e);
			return res.status(500).json({error: "Unknown server error!"});
	}
});

const mime = require("mime");
const Canvas = require("canvas");
const imageSize = require("image-size");
app.get("/files/get/:filename", async (req, res) => {
	const file = filePath + req.params.filename;
	const ext = path.extname(req.params.filename);
	if (!fs.existsSync(file)) return res.sendStatus(404);
	let buffer = fs.readFileSync(file);

	if (config.uploadWatermark && !(load > config.uploadWatermarkLoad) && config.uploadWatermarkExts.includes(ext.slice(1)) && mime.getType(ext).includes("image")) {
		const size = imageSize(file);
		const canvas = Canvas.createCanvas(size.width, size.height);
		const ctx = canvas.getContext("2d");
		const background = new Canvas.Image();
		background.src = buffer;
		const watermark = await Canvas.loadImage(config.uploadWatermarkUrl);
		ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
		ctx.globalAlpha = 0.6
		const watermarkSize = (_ => {
			const min = canvas.width < canvas.height ? canvas.width : canvas.height;
			if (min * config.uploadWatermarkSize.mult > config.uploadWatermarkSize.max) return config.uploadWatermarkSize.max
			else if (min * config.uploadWatermarkSize.mult < config.uploadWatermarkSize.min) return config.uploadWatermarkSize.min
			else return min * config.uploadWatermarkSize.mult
		})()
		ctx.drawImage(watermark, canvas.width - watermarkSize*1.2, canvas.height - watermarkSize*1.2, watermarkSize, watermarkSize);
		buffer = canvas.toBuffer();
	}
	res.writeHead(200, {
		"Content-Type": mime.getType(ext),
		"Content-Length": buffer.length,
		//"Content-Range": `bytes 0-${buffer.length}/${buffer.length}`,
		"Accept-Ranges": "bytes"
	})
	res.end(buffer);
})

app.get("/files/delete/:filename/:key?", async (req,res) => {
	const file = filePath + req.params.filename;
	if (!fs.existsSync(file)) return res.sendStatus(404);
	const md5sum = crypto.createHash("md5").update(fs.readFileSync(file)).digest("base64url");
	const md5stamp = crypto.createHash("md5").update(fs.statSync(file).birthtime.getTime().toString()).digest("base64url");
	if (req.params.key.slice(0,6) != md5sum.slice(7,13) || req.params.key.slice(-8) != md5stamp.slice(8,16)) return res.status(403).json({error: "Wrong delete key"});
	fs.rmSync(file);
	res.sendStatus(200);
})

/*   ~~~   DISCORD   ~~~   */
app.get("/discord/embed/", async(req,res) => {
	res.setHeader("Content-Type", "text/html");
	const oEmbed = `${config.host}/discord/embed/oembed_gen?title=${encodeURIComponent(req.query.title||"")}&url=${encodeURIComponent(req.query.url||"")}&author=${encodeURIComponent(req.query.author||"")}&author_url=${encodeURIComponent(req.query.author_url||"")}&bold=${encodeURIComponent(req.query.bold||"")}&bold_url=${encodeURIComponent(req.query.bold_url||"")}`;
	res.send(`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta property="og:type" content="website">
			${req.query.title ? `<meta property="og:title" content="${req.query.title}">` : ""}
			${req.query.url ? `<meta property="og:url" content="${req.query.url}" />` : ""}
			${req.query.description ? `<meta property="og:description" content="${req.query.description}" />` : ""}
			${req.query.thumbnail ? `<meta property="og:image" content="${req.query.thumbnail}" />` : ""}
			${req.query.thumbnail_width ? `<meta property="og:image:width" content="${req.query.thumbnail_width}" />` : ""}
			${req.query.thumbnail_height ? `<meta property="og:image:height" content="${req.query.thumbnail_height}" />` : ""}
			${req.query.thumbnail_big === "true" ? `<meta name="twitter:card" content="summary_large_image" />` : ""}
			${req.query.color ? `<meta name="theme-color" content="${req.query.color}" />` : ""}
			<link type="application/json+oembed" href="${oEmbed}" />
		</head>
		<body><pre>This page is for embedding only.</pre></body>
		</html>
	`);
})
app.get("/discord/embed/oembed_gen/", async(req,res) => {
	res.json({
		title: req.query.title,
		url: req.query.url,

		author_name: req.query.bold,
		author_url: req.query.bold_url,
	 
		provider_name: req.query.author,
		provider_url: req.query.author_url,
	 });
})

/*   ~~~   FIGLET   ~~~   */
const figlet = require("figlet");

app.get("/figlet/", async(req,res) => {
	const text = req.query.text
	const font = req.query.font?.replace(/.?.(\/|\\)/gi, "") || "big";
	
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

/*   ~~~   ~~~   ~~~   */