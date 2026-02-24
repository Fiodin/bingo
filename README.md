# Bullshit-Bingo - Multiplayer Edition

🎯 Web-basiertes Multiplayer-Bingo für Seminare und Tagungen

## Features

- ✅ **Multiplayer** - Jeder hat sein eigenes Board
- ✅ **Live-Leaderboard** - Echtzeit-Anzeige aller Spieler
- ✅ **Reihen-Detection** - Zeigt horizontale/vertikale/diagonale Reihen
- ✅ **LocalStorage** - Spielstand bleibt erhalten
- ✅ **Admin-Interface** - Themen im Browser verwalten
- ✅ **Multi-Themen** - Verschiedene Bingo-Varianten
- ✅ **Handy-optimiert** - Funktioniert auf allen Geräten

## Installation

### 1. Dependencies installieren
```bash
npm install
```

### 2. Admin-Passwort setzen
```bash
cp admin-config.json.example admin-config.json
nano admin-config.json
# Passwort ändern!
```

### 3. Server starten
```bash
node bingo-server.js
# Oder als Service (siehe INSTALLATION.md)
```

### 4. Öffnen
- Startseite: http://localhost:3001
- Admin: http://localhost:3001/admin

## Dateien
```
├── bingo-server.js          # Node.js Server
├── index.html               # Startseite mit Themenauswahl
├── theme-template.html      # Template für Bingo-Seiten
├── admin.html               # Admin-Interface
├── themes.json              # Themen-Datenbank
├── admin-config.json        # Login-Daten (NICHT committen!)
└── package.json
```

## Themen verwalten

### Im Browser (empfohlen)
1. Öffne `/admin`
2. Login mit Credentials aus `admin-config.json`
3. Themen bearbeiten/hinzufügen

### In der Konsole
```bash
nano themes.json
# Änderungen machen
# Speichern → Auto-Reload!
```

## Eigene Themen hinzufügen

Siehe `UPDATE-MULTI-THEME.md` und `ADMIN-INSTALLATION.md`

## Deployment

Für Produktion mit Nginx siehe `INSTALLATION-ASDF-STADT.md`

## Standard-Login

**Username:** admin  
**Passwort:** bingo2024  

⚠️ **WICHTIG:** Passwort nach Installation ändern!

## Port

Standard: **3001** (konfigurierbar via `PORT` environment variable)

## Lizenz

MIT

## Credits

Erstellt für AI & Low-Code/No-Code Seminare 🤖
