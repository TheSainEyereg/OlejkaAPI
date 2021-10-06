const express = require("express");
const config = require("./config.json");
process.on("unhandledRejection", e => {console.error(e)});

const app = express();
const port = 5050

app.listen(port, e => {
    if (e) {console.error(e); return process.exit(1)}
    console.log("Server started at http://127.0.0.1:"+port);
});

app.get("/", (req,res) => res.send("Olejka API v2"))

/*   ~~~   AUDIO   ~~~   */
const scdl = require("soundcloud-downloader").default;
const ytdl = require("ytdl-core");
app.get("/audio/yt/:id", async (req,res) => {
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${req.params.id}`);
    if (!info) return res.sendStatus(404);
    try {
        const stream = await ytdl(info.videoDetails.videoId, {filter: "audioonly", quality: "highestaudio"});
        res.writeHead(200, {
            "Content-Type": "audio/mpeg"
        });
        stream.pipe(res);
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
        res.writeHead(200, {
            "Content-Type": "audio/mpeg"
        });
        stream.pipe(res);
    } catch (e) {
        console.log(e);
        res.sendStatus(500);
    }
})

/*   ~~~   FILES   ~~~   */
const os = require("os");
const filedir = (config.uploadHome ? os.homedir() : ".") + config.uploadDir + "/";
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");
const upload = multer({storage: multer.memoryStorage()});
app.post("/files/upload/", upload.single("file") ,async (req,res) => {
    if (!fs.existsSync(filedir)) fs.mkdirSync(filedir);
    if (!req.body.key) return res.status(401).json({error: "No upload key provided!"});
    if (req.body.key !== config.uploadKey) return res.status(403).json({error: "Wrong upload key!"});
    if (!req.file) return res.status(406).json({error: "Invalid form data!"});
    const file = req.file;
    const ext= path.extname(file.originalname);
    if (!config.uploadExts.includes(ext.slice(1))) return res.status(406).json({error: "File format is not allowed!"});
    const md5sum = crypto.createHash("md5").update(file.buffer).digest("hex");
    const filename = md5sum.slice(-8)+ext;
    if (!fs.existsSync(filedir+filename)) fs.writeFileSync(filedir+filename, file.buffer);
    const md5stamp = crypto.createHash("md5").update(fs.statSync(filedir+filename).birthtime.getTime().toString()).digest("hex");
    res.json({
        filename: filename,
        original: file.originalname,
        get: `/files/get/${filename}`,
        delete: `/files/delete/${filename}/${md5sum.slice(13,19)}_${md5stamp.slice(14,22)}`
    })
})
const mime = require("mime");
app.get("/files/get/:filename", async (req, res) => {
    const file = filedir + req.params.filename;
    if (!fs.existsSync(file)) return res.sendStatus(404);
    const buffer = fs.readFileSync(file);
    res.set({
        "Content-Type": mime.getType(path.extname(req.params.filename)),
        "Content-Length": buffer.length
    })
    res.send(buffer);
})
app.get("/files/delete/:filename/:key?", async (req,res) => {
    const file = filedir + req.params.filename;
    if (!fs.existsSync(file)) return res.sendStatus(404);
    const md5sum = crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex");
    const md5stamp = crypto.createHash("md5").update(fs.statSync(file).birthtime.getTime().toString()).digest("hex");
    if (req.params.key !== `${md5sum.slice(13,19)}_${md5stamp.slice(14,22)}`) return res.status(403).json({error: "Wrong delete key"});
    fs.rmSync(file);
    res.json({
        filename: req.params.filename
    })
})
