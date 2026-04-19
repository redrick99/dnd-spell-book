# Libro degli Incantesimi — D&D 5e

A static web app to browse and filter all D&D 5th Edition spells, with an Italian interface and spell descriptions.

## Features

- **336 spells** from the D&D 5e SRD with Italian translations
- Filter by **class**, **level**, **school**, and **action type**
- Free-text search by spell name
- Sort alphabetically, by level (with group headers), or by school
- Click any spell card to open a detail modal with full description
- Dark fantasy theme with school-coded colors

## Usage

The app fetches `incantesimi_db.json` at runtime, so it must be served via a local HTTP server — opening `index.html` directly as a `file://` URL won't work.

```bash
# Option 1 — Node
npx serve .

# Option 2 — Python
python3 -m http.server 8080
```

Then open `http://localhost:3000` (or `8080`) in your browser.

## Project Structure

```
dnd-spell-book/
├── index.html          # Page structure
├── style.css           # Dark fantasy theme
├── app.js              # Filtering, sorting, rendering logic
└── incantesimi_db.json # Spell database (336 spells)
```
