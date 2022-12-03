# OlejkaAPI
 API for api.olejka.ru

config.json:
```json
{
	"port": 5050,
	"host": "https://polygon.olejka.ru/api",
	"maxLoad": 0.75,

	"masterKey": "key",
	
	"uploader": {
		"extensions": [
			"png","jpg","bmp","webp","ico","svg","gif","apng",
			"rar","zip","7z",
			"mp4","avi","mp3","wav",
			"txt","h","cpp","java","cs","lua","html","css","js","exe","dll"
		],
		"path": "/debug",
		"useHome": false,
		"watermark": {
			"enabled": true,
			"url": "https://olejka.ru/r/6a4e597580.png",
			"size": {
				"mult": 0.25,
				"max": 45,
				"min": 20
			},
			"extensions": ["png","jpg","bmp","webp"],
			"maxLoad": 0.5
		}
	},
	
	"figlet": {
		"defaultFont": "Big"
	},

	"audio": {
		"vkTTSVoice": "pavel"
	}
}
```

---
If you have any troubles on Linux machines with Canvas or another lib, try installing dependencies:

**Debian based (Ubuntu, Linux Mint):**
```sh
sudo apt update 
sudo apt install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev -y
npm i #or npm i canvas
```
**RPM based (Fedora, CentOS):**
```sh
sudo yum check-update
sudo yum install gcc-c++ cairo-devel pango-devel libjpeg-turbo-devel giflib-devel -y
npm i #or npm i canvas
```