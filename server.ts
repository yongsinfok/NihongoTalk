import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI } from '@google/genai';
import { loadEnvConfig } from '@next/env';

const dev = process.env.NODE_ENV !== 'production';
const projectDir = process.cwd();
loadEnvConfig(projectDir, dev, { info: console.log, error: console.error });

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        const { pathname } = parse(request.url!, true);

        if (pathname === '/api/live') {
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request);
            });
        } else {
            socket.destroy();
        }
    });

    wss.on('connection', async (ws: WebSocket) => {
        console.log('Client connected');

        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not set');
            ws.close(1008, 'API Key not configured on server');
            return;
        }

        const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        let session: any = null;

        ws.on('message', async (data, isBinary) => {
            if (isBinary) {
                // Audio data from client
                if (session) {
                    try {
                        const base64 = (data as Buffer).toString('base64');
                        session.sendRealtimeInput({
                            media: {
                                mimeType: 'audio/pcm;rate=16000',
                                data: base64
                            }
                        });
                    } catch (e) {
                        console.error('Error sending to Gemini:', e);
                    }
                }
            } else {
                // Text message (JSON)
                try {
                    const msg = JSON.parse(data.toString());

                    if (msg.type === 'config') {
                        const config = msg.config;
                        session = await ai.live.connect({
                            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                            config: config,
                            callbacks: {
                                onopen: () => {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        ws.send(JSON.stringify({ type: 'open' }));
                                    }
                                },
                                onmessage: (serverMsg: any) => {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        ws.send(JSON.stringify({ type: 'message', data: serverMsg }));
                                    }
                                },
                                onclose: () => {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        ws.send(JSON.stringify({ type: 'close' }));
                                    }
                                },
                                onerror: (err: any) => {
                                    if (ws.readyState === WebSocket.OPEN) {
                                        ws.send(JSON.stringify({ type: 'error', error: err.message }));
                                    }
                                }
                            }
                        } as any);

                        console.log('Connected to Gemini');

                    } else if (msg.type === 'text') {
                        if (session) {
                            session.sendRealtimeInput({
                                content: [{ parts: [{ text: msg.text }] }]
                            });
                        }
                    } else if (msg.type === 'tool_response') {
                        if (session) {
                            session.sendToolResponse(msg.response);
                        }
                    }
                } catch (e) {
                    console.error('Error processing message:', e);
                }
            }
        });

        ws.on('close', () => {
            console.log('Client disconnected');
            if (session) {
                // session.close() might not exist on the object returned by connect() depending on SDK version,
                // but usually it does or we just let it be garbage collected.
                // The SDK documentation says connect returns a session.
                try {
                    // session.close(); 
                } catch (e) { }
            }
        });

        ws.on('error', (err) => {
            console.error('WebSocket error:', err);
        });
    });

    server.listen(3000, () => {
        console.log('> Ready on http://localhost:3000');
    });
});
