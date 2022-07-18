echo "Starting API.  To view window type screen -r APIv2."
echo "To minimize the window and let the server run in the background, press Ctrl+A then Ctrl+D"
cd /home/ubuntu/olejka.ru_api/v2/
/bin/screen -dmS APIv2 /home/ubuntu/.nvm/versions/node/v17.0.1/bin/node index.js
