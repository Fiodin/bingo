const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Pfade zu Konfigurationsdateien
const THEMES_FILE = path.join(__dirname, 'themes.json');
const ADMIN_CONFIG_FILE = path.join(__dirname, 'admin-config.json');

// Themen aus JSON-Datei laden
let THEMES = {};

function loadThemes() {
    try {
        const data = fs.readFileSync(THEMES_FILE, 'utf8');
        THEMES = JSON.parse(data);
        console.log('✅ Themen geladen:', Object.keys(THEMES).join(', '));
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Laden der Themen:', error);
        // Fallback zu leeren Themen
        THEMES = {};
        return false;
    }
}

// Themen speichern
function saveThemes() {
    try {
        fs.writeFileSync(THEMES_FILE, JSON.stringify(THEMES, null, 2), 'utf8');
        console.log('✅ Themen gespeichert');
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Themen:', error);
        return false;
    }
}

// Admin-Login prüfen (Simple Auth - für Produktion bcrypt verwenden!)
function checkAdminAuth(authHeader) {
    try {
        const adminConfig = JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE, 'utf8'));
        
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return false;
        }
        
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');
        
        // Einfacher Vergleich (in Produktion bcrypt verwenden!)
        return username === adminConfig.username && password === adminConfig._password_plain;
    } catch (error) {
        console.error('Auth Error:', error);
        return false;
    }
}

// Themen beim Start laden
loadThemes();

// HTTP Server für statische Dateien
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // Root redirect zur Themenauswahl
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Admin-Interface
    if (pathname === '/admin') {
        serveAdminPage(req, res);
        return;
    }
    
    // Admin API Endpoints (mit Auth)
    if (pathname.startsWith('/api/admin/')) {
        handleAdminAPI(req, res, pathname);
        return;
    }
    
    // Themen-spezifische Seiten
    const themeMatch = pathname.match(/^\/(ai-lowcode|agile|meeting|corporate|[a-z0-9-]+)$/);
    if (themeMatch) {
        const theme = themeMatch[1];
        serveThemePage(res, theme);
        return;
    }
    
    // API Endpoint für Themen-Daten
    if (pathname === '/api/themes') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(THEMES));
        return;
    }
    
    // Statische Dateien
    let filePath = '.' + pathname;
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 - Datei nicht gefunden');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Admin-Seite ausliefern
function serveAdminPage(req, res) {
    fs.readFile('./admin.html', 'utf8', (error, content) => {
        if (error) {
            res.writeHead(500);
            res.end('Admin Template Error');
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
    });
}

// Admin API Handler
function handleAdminAPI(req, res, pathname) {
    // Auth prüfen
    const authHeader = req.headers.authorization;
    if (!checkAdminAuth(authHeader)) {
        res.writeHead(401, { 
            'WWW-Authenticate': 'Basic realm="Admin Area"',
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }
    
    // GET /api/admin/themes - Alle Themen abrufen
    if (pathname === '/api/admin/themes' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(THEMES));
        return;
    }
    
    // POST /api/admin/themes - Themen speichern
    if (pathname === '/api/admin/themes' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const newThemes = JSON.parse(body);
                
                // Validierung
                for (const [id, theme] of Object.entries(newThemes)) {
                    if (!theme.title || !theme.words || !Array.isArray(theme.words)) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Invalid theme format' }));
                        return;
                    }
                    if (theme.words.length !== 9) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: `Theme ${id} must have exactly 9 words` }));
                        return;
                    }
                }
                
                THEMES = newThemes;
                saveThemes();
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Themes saved' }));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        return;
    }
    
    // DELETE /api/admin/themes/:id - Thema löschen
    const deleteMatch = pathname.match(/^\/api\/admin\/themes\/([a-z0-9-]+)$/);
    if (deleteMatch && req.method === 'DELETE') {
        const themeId = deleteMatch[1];
        if (THEMES[themeId]) {
            delete THEMES[themeId];
            saveThemes();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Theme deleted' }));
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Theme not found' }));
        }
        return;
    }
    
    res.writeHead(404);
    res.end('Not Found');
}

// Dynamische Themen-Seite generieren
function serveThemePage(res, themeId) {
    const theme = THEMES[themeId];
    if (!theme) {
        res.writeHead(404);
        res.end('Theme not found');
        return;
    }
    
    fs.readFile('./theme-template.html', 'utf8', (error, content) => {
        if (error) {
            res.writeHead(500);
            res.end('Template Error');
            return;
        }
        
        // Template-Variablen ersetzen
        const html = content
            .replace(/\{\{THEME_ID\}\}/g, themeId)
            .replace(/\{\{THEME_TITLE\}\}/g, theme.title)
            .replace(/\{\{THEME_COLOR\}\}/g, theme.color);
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    });
}

// WebSocket Server - separierte Räume pro Thema
const wss = new WebSocket.Server({ server });

// Spieler-Datenbank pro Raum
const rooms = new Map();

// Raum initialisieren falls nicht vorhanden
function ensureRoom(roomId) {
    if (!rooms.has(roomId)) {
        rooms.set(roomId, new Map());
    }
    return rooms.get(roomId);
}

// Broadcast an alle verbundenen Clients in einem Raum
function broadcastToRoom(roomId, data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.roomId === roomId) {
            client.send(JSON.stringify(data));
        }
    });
}

// Leaderboard für einen Raum aktualisieren
function updateLeaderboard(roomId) {
    const players = ensureRoom(roomId);
    const leaderboard = Array.from(players.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    
    broadcastToRoom(roomId, {
        type: 'leaderboard',
        data: leaderboard
    });
}

wss.on('connection', (ws) => {
    console.log('Neuer Spieler verbunden');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch(data.type) {
                case 'join':
                    // Raum beitreten
                    ws.roomId = data.roomId;
                    console.log(`Spieler tritt Raum bei: ${data.roomId}`);
                    break;
                
                case 'register':
                    // Spieler registrieren
                    ws.playerId = data.playerId;
                    ws.roomId = data.roomId || 'ai-lowcode';
                    
                    const players = ensureRoom(ws.roomId);
                    players.set(data.playerId, {
                        id: data.playerId,
                        name: data.name,
                        score: 0,
                        bingo: false,
                        rows: { horizontal: [], vertical: [], diagonal: [] }
                    });
                    updateLeaderboard(ws.roomId);
                    console.log(`Spieler registriert in ${ws.roomId}: ${data.name}`);
                    break;
                
                case 'update':
                    // Score aktualisieren
                    if (ws.roomId) {
                        const players = ensureRoom(ws.roomId);
                        if (players.has(data.playerId)) {
                            const player = players.get(data.playerId);
                            player.score = data.score;
                            player.bingo = data.bingo;
                            player.rows = data.rows || { horizontal: [], vertical: [], diagonal: [] };
                            players.set(data.playerId, player);
                            updateLeaderboard(ws.roomId);
                        }
                    }
                    break;
                
                case 'reset':
                    // Spieler zurücksetzen
                    if (ws.roomId) {
                        const players = ensureRoom(ws.roomId);
                        if (players.has(data.playerId)) {
                            const player = players.get(data.playerId);
                            player.score = 0;
                            player.bingo = false;
                            player.rows = { horizontal: [], vertical: [], diagonal: [] };
                            players.set(data.playerId, player);
                            updateLeaderboard(ws.roomId);
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error('Fehler beim Verarbeiten der Nachricht:', error);
        }
    });
    
    ws.on('close', () => {
        if (ws.playerId && ws.roomId) {
            console.log(`Spieler getrennt: ${ws.playerId} aus Raum ${ws.roomId}`);
            const players = ensureRoom(ws.roomId);
            players.delete(ws.playerId);
            updateLeaderboard(ws.roomId);
        }
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`🎯 Bullshit-Bingo Server läuft auf Port ${PORT}`);
    console.log(`Öffne http://localhost:${PORT} im Browser`);
    console.log(`Admin-Interface: http://localhost:${PORT}/admin`);
    console.log(`Verfügbare Themen: ${Object.keys(THEMES).join(', ')}`);
});

// File Watcher für themes.json - automatisches Neuladen bei manuellen Änderungen
fs.watch(THEMES_FILE, (eventType, filename) => {
    if (eventType === 'change') {
        console.log('📝 themes.json wurde geändert - lade Themen neu...');
        loadThemes();
    }
});

console.log('👀 Watching themes.json for changes...');
