const os = require("os");
const fs = require("fs");
const path = require("path");
const express = require("express");
process.on("unhandledRejection", e => {console.error(e)});
let config, filePath;
let loadConfig = () => {
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
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("System-Load", load = os.loadavg()[0] / os.cpus().length);
    res.setHeader("System-Time", time = new Date().getTime());
	if (config.error) return res.status(500).json(config);
    if (load > config.maxLoad) return res.sendStatus(503)
    next()
});
app.get("/", (req,res) => res.send(`Olejka API v2\n\nTime: ${time}\nLoad: ${load}`));


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
const multer = require("multer");
const upload = multer({storage: multer.memoryStorage()});
app.post("/files/upload/", upload.single("file") ,async (req,res) => {
    if (!fs.existsSync(filePath)) fs.mkdirSync(filePath);
    if (!req.body.key) return res.status(401).json({error: "No upload key provided!"});
    if (req.body.key !== config.uploadKey) return res.status(403).json({error: "Wrong upload key!"});
    if (!req.file) return res.status(406).json({error: "Invalid form data!"});
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
})
const mime = require("mime");
const Canvas = require("canvas");
const imageSize = require("image-size");
const { Stream } = require("stream");
app.get("/files/get/:filename", async (req, res) => {
    const file = filePath + req.params.filename;
    const ext = path.extname(req.params.filename);
    if (!fs.existsSync(file)) return res.sendStatus(404);
    let buffer = fs.readFileSync(file);

    if (!(load > config.uploadWatermarkLoad) && config.uploadWatermark && config.uploadWatermarkExts.includes(ext.slice(1)) && mime.getType(ext).includes("image")) {
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
    res.set({
        "Content-Type": mime.getType(ext),
        "Content-Length": buffer.length
    })
    res.send(buffer);
})
app.get("/files/delete/:filename/:key?", async (req,res) => {
    const file = filePath + req.params.filename;
    if (!fs.existsSync(file)) return res.sendStatus(404);
    const md5sum = crypto.createHash("md5").update(fs.readFileSync(file)).digest("base64url");
    const md5stamp = crypto.createHash("md5").update(fs.statSync(file).birthtime.getTime().toString()).digest("base64url");
    if (req.params.key.slice(0,6) != md5sum.slice(7,13) || req.params.key.slice(-8) != md5stamp.slice(8,16)) return res.status(403).json({error: "Wrong delete key"});
    console.log()
    fs.rmSync(file);
    res.sendStatus(200);
})
/*   ~~~   ~~~   ~~~   */