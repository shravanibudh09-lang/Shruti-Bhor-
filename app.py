"""
Tiny Celebration — Flask backend
A tiny birthday micro-site: Flask serves the page, SQLite stores the
recipient's details and the stack of birthday wishes that get revealed
as flip-cards at the end of the experience.
"""

from flask import Flask, g, jsonify, render_template, request
import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "birthday.db")

app = Flask(__name__)


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create tables (if needed) and seed some starter content."""
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            recipient_name TEXT NOT NULL DEFAULT 'You',
            sender_name TEXT NOT NULL DEFAULT 'A friend',
            intro_message TEXT NOT NULL DEFAULT 'Someone made you a tiny page.'
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS wishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            position INTEGER NOT NULL
        )
        """
    )

    # Seed settings row once.
    row = db.execute("SELECT COUNT(*) AS c FROM settings").fetchone()
    if row["c"] == 0:
        db.execute(
            "INSERT INTO settings (id, recipient_name, sender_name, intro_message) "
            "VALUES (1, ?, ?, ?)",
            ("", "", "Someone made you a tiny page."),
        )

    # Seed a starter set of wishes once.
    row = db.execute("SELECT COUNT(*) AS c FROM wishes").fetchone()
    if row["c"] == 0:
        starter_wishes = [
            "Happy Birthday to the Person I love most ❤️ . May this year be filled with soft mornings, good news, and memories that last a while.",
            "May this year fill your heart with calm,your wishes and aspirations be fulfilled, and your days with unexpected happiness.",
            "You receive as much happiness as i given you.May your all dreams come true.God always bless you dear ❤️ ",
            "Even though I couldn't make it to your birthday 😍 , I was reminded of it every time I made this 🫶 .Once again Happy Birthday Aahoo 🧿🩷",
        ]
        db.executemany(
            "INSERT INTO wishes (message, position) VALUES (?, ?)",
            [(msg, i) for i, msg in enumerate(starter_wishes)],
        )

    db.commit()
    db.close()


# ---------------------------------------------------------------------------
# Page route
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.route("/api/data")
def get_data():
    db = get_db()
    settings = db.execute("SELECT * FROM settings WHERE id = 1").fetchone()
    wishes = db.execute(
        "SELECT id, message FROM wishes ORDER BY position ASC"
    ).fetchall()

    return jsonify(
        {
            "recipient_name": settings["recipient_name"],
            "sender_name": settings["sender_name"],
            "intro_message": settings["intro_message"],
            "wishes": [{"id": w["id"], "message": w["message"]} for w in wishes],
        }
    )


@app.route("/api/settings", methods=["POST"])
def update_settings():
    """Update recipient name / sender name / intro message."""
    data = request.get_json(force=True) or {}
    recipient_name = (data.get("recipient_name") or "").strip()
    sender_name = (data.get("sender_name") or "").strip()
    intro_message = (data.get("intro_message") or "").strip()

    if not recipient_name or not sender_name or not intro_message:
        return jsonify({"error": "recipient_name, sender_name and intro_message are all required"}), 400

    db = get_db()
    db.execute(
        "UPDATE settings SET recipient_name = ?, sender_name = ?, intro_message = ? WHERE id = 1",
        (recipient_name, sender_name, intro_message),
    )
    db.commit()
    return jsonify({"ok": True})


@app.route("/api/wishes", methods=["GET"])
def list_wishes():
    db = get_db()
    wishes = db.execute("SELECT id, message FROM wishes ORDER BY position ASC").fetchall()
    return jsonify([{"id": w["id"], "message": w["message"]} for w in wishes])


@app.route("/api/wishes", methods=["POST"])
def add_wish():
    data = request.get_json(force=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "message is required"}), 400

    db = get_db()
    row = db.execute("SELECT COALESCE(MAX(position), -1) AS m FROM wishes").fetchone()
    next_position = row["m"] + 1
    cur = db.execute(
        "INSERT INTO wishes (message, position) VALUES (?, ?)", (message, next_position)
    )
    db.commit()
    return jsonify({"id": cur.lastrowid, "message": message}), 201


@app.route("/api/wishes/<int:wish_id>", methods=["DELETE"])
def delete_wish(wish_id):
    db = get_db()
    db.execute("DELETE FROM wishes WHERE id = ?", (wish_id,))
    db.commit()
    return jsonify({"ok": True})


if __name__ == "__main__":
    init_db()
    app.run(debug=True, host="0.0.0.0", port=5000)
