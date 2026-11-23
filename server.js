import http from 'http';
import fs from 'fs';
import { WebSocketServer } from 'ws';

const server = http.createServer((req, res) => {
    const files = {
        "/": { path: "./public/index.html", contentType: "text/html" },
        "/index.html": { path: "./public/index.html", contentType: "text/html" },
        "/script.js": { path: "./public/script.js", contentType: "application/javascript" }
    }
    const file = files[req.url];
    if (!file) {
        res.writeHead(404, { "content-type": "text/plain" });
        res.end("Not found");
        return;
    }
    fs.readFile(file.path, (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end("Error loading page");
            return;
        }

        res.writeHead(200, { "content-type": file.contentType });
        res.end(data);
    });
});

const wss = new WebSocketServer({ server });

wss.on("connection", (socket, req) => {
    const username = new URL(req.url, `http://localhost`).searchParams.get("username");
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ "type": "system", "text": `${username} joined` }));
        }
    });

    socket.on("message", (data) => {
        const { username, text } = JSON.parse(data);
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "chat",
                    username,
                    text,
                }));
            }
        });
    });

    socket.on("close", () => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: "system",
                    text: `${username} left`,
                }));
            }
        })
    });

    socket.on("error", (err) => {
        console.error(err);
    });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Chat server running at http://localhost:${PORT}`);
});