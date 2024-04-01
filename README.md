# OlejkaAPI
 API for api.olejka.ru

## How to use
1. Install NodeJS
2. Install yarn `npm i -g`
3. Run `yarn` and `yarn build`
4. Run `yarn start` or with PM2 `pm2 start dist/app.js --name API`

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
