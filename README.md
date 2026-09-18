# A Tiny Celebration 🎂

A tiny birthday micro-site: a "do you want to see it?" landing screen,
a soft reveal, a balloons-and-lights celebration, a cake to blow out,
and a stack of flip-cards with personal birthday wishes — all served
by Flask, with the recipient's details and wishes stored in SQLite.

## Project structure

```
birthday-app/
├── app.py                  # Flask app + SQLite setup + API routes
├── requirements.txt
├── birthday.db              # created automatically on first run
├── templates/
│   └── index.html
└── static/
    ├── css/style.css
    └── js/script.js
```

## Run it

```bash
cd birthday-app
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Then open **http://localhost:5000** in your browser.

The first time it runs, `app.py` creates `birthday.db` and seeds it
with a default recipient name and four starter wishes, so the page
works immediately.

## Adding a birthday song

The page is wired up to autoplay a song once the visitor taps
**"Show me"** (browsers require that first tap before audio is
allowed to play), and there's a small note icon top-right to
mute/unmute any time.

I can't include an actual copyrighted song file in the code — but the
player works with any MP3 you provide yourself:

1. Get an MP3 of a song you own/have licensed, or a royalty-free track
   (YouTube Audio Library, Pixabay Music, Free Music Archive, or a
   paid library like Artlist/Epidemic Sound).
2. Rename it to `song.mp3`.
3. Drop it into `static/audio/song.mp3` (there's a placeholder note in
   that folder telling you the same thing).

No code changes needed — the `<audio>` tag already points at that
path. If the file isn't there, the page just runs silently instead of
throwing an error.

## Customize the content

You don't need to touch the code to personalize it — just call the API
(e.g. from `curl`, Postman, or a quick browser fetch call):

**Change the names / intro line**
```bash
curl -X POST http://localhost:5000/api/settings \
  -H "Content-Type: application/json" \
  -d '{"recipient_name": "Riya", "sender_name": "Aman", "intro_message": "Someone made you a tiny page."}'
```

**Add a wish**
```bash
curl -X POST http://localhost:5000/api/wishes \
  -H "Content-Type: application/json" \
  -d '{"message": "May every year be softer and brighter than the last."}'
```

**Remove a wish** (find its `id` from `GET /api/wishes`)
```bash
curl -X DELETE http://localhost:5000/api/wishes/3
```

Or just open `birthday.db` in any SQLite browser (e.g. DB Browser for
SQLite) and edit the `settings` and `wishes` tables directly.

## API reference

| Method | Route              | Purpose                                   |
|--------|--------------------|--------------------------------------------|
| GET    | `/api/data`        | Everything the page needs in one call      |
| POST   | `/api/settings`    | Update recipient/sender name + intro line  |
| GET    | `/api/wishes`      | List all wishes                            |
| POST   | `/api/wishes`      | Add a wish (`{"message": "..."}`)          |
| DELETE | `/api/wishes/<id>` | Remove a wish                              |

## Notes

- The database file (`birthday.db`) is created next to `app.py` the
  first time the app runs — delete it if you want to reset back to
  the default seed content.
- Everything is a single scrolling flow, no page reloads — screens are
  just shown/hidden with JavaScript.
