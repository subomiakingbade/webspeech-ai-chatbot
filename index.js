
'use strict';

import 'dotenv/config'; // for API key
import express from 'express';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// OpenAI API Endpoint
app.get('/test', async (req, res) => {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello!' }],
        });
        res.send(response.choices[0].message.content);
    } catch (error) {
        console.error("Error with OpenAI API:", error);
        res.status(500).send('An error occurred');
    }
});

// Initializing HTTP and Socket.io servers
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('A user connected');

    // Receive and respond to 'chat message'
    socket.on('chat message', async (msg) => {
        console.log('Message received from client:', msg);

        // Send message to OpenAI
        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: msg }],
            });
            const botReply = response.choices[0].message.content;
            socket.emit('bot reply', botReply);
        } catch (error) {
            console.error('Error sending message to OpenAI:', error);
            socket.emit('bot reply', 'Error processing request.');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
