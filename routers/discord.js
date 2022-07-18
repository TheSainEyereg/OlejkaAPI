import { Router } from "express";
const router = Router();


router.get("/embed/", async(req,res) => {
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

router.get("/embed/oembed_gen/", async(req,res) => {
	res.json({
		title: req.query.title,
		url: req.query.url,

		author_name: req.query.bold,
		author_url: req.query.bold_url,
	 
		provider_name: req.query.author,
		provider_url: req.query.author_url,
	 });
})


export default router;