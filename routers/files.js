import { Router } from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { config, filePath } from "../components/config.js";

const router = Router();

import multer from "multer"; // Parser for multipart/form-data
const upload = multer({storage: multer.memoryStorage()});
router.post("/upload/", upload.single("file") ,async (req,res) => {
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
})

import mime from "mime";
import Canvas from "canvas";
import imageSize from "image-size";
router.get("/get/:filename", async (req, res) => {
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

router.get("/delete/:filename/:key?", async (req,res) => {
	const file = filePath + req.params.filename;
	if (!fs.existsSync(file)) return res.sendStatus(404);
	const md5sum = crypto.createHash("md5").update(fs.readFileSync(file)).digest("base64url");
	const md5stamp = crypto.createHash("md5").update(fs.statSync(file).birthtime.getTime().toString()).digest("base64url");
	if (req.params.key.slice(0,6) != md5sum.slice(7,13) || req.params.key.slice(-8) != md5stamp.slice(8,16)) return res.status(403).json({error: "Wrong delete key"});
	fs.rmSync(file);
	res.sendStatus(200);
})


export default router;