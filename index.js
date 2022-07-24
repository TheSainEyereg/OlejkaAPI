import os from "os";
import express from "express";
import cors from "cors";
import { config } from "./components/config.js";

process.on("unhandledRejection", e => {console.error(e)});

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
	global.load = load;
	global.time = time;

	if (config.error) return res.status(500).json(config);
	if (load > config.maxLoad) return res.sendStatus(503);
	next();
});

app.get("/", cors(), (req,res) => res.setHeader("Content-Type", "text/plain").send(`Olejka API v2\n\nTime: ${time}\nLoad: ${load}`));


import audio from "./routers/audio.js";
app.use("/audio", audio);

import files from "./routers/files.js";
app.use("/files", files);

import discord from "./routers/discord.js";
app.use("/discord", discord);

import figlet from "./routers/figlet.js";
app.use("/figlet", figlet);