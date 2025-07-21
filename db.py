import sqlite3

class Database:
    def __init__(self, db_path='tabs.db'):
        self.db_path = db_path
        self._init_db()

    def _connect(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        with self._connect() as conn:
            c = conn.cursor()
            c.execute('''
                CREATE TABLE IF NOT EXISTS tabs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    artist TEXT NOT NULL,
                    type TEXT NOT NULL,
                    tuning TEXT,
                    capo TEXT,
                    difficulty TEXT,
                    content TEXT NOT NULL
                )
            ''')
            conn.commit()
            # Seed with example data if empty
            c.execute('SELECT COUNT(*) FROM tabs')
            if c.fetchone()[0] == 0:
                c.execute('''INSERT INTO tabs (title, artist, type, tuning, capo, difficulty, content) VALUES 
                    ("Wonderwall", "Oasis", "Chords", "", "2", "Beginner", "C Em G D A ..."),
                    ("Hotel California", "Eagles", "Tab", "Standard", "", "Intermediate", "e|--0--| ..."),
                    ("Nothing Else Matters", "Metallica", "Tab", "Standard", "", "Advanced", "E|----| ..."),
                    ("Riptide", "Vance Joy", "Chords", "", "1", "Beginner", "Am G C F ..."),
                    ("Tears in Heaven", "Eric Clapton", "Tab", "Standard", "", "Intermediate", "e|----| ...")
                ''')
                conn.commit()

    def search_tabs(self, query=None):
        with self._connect() as conn:
            c = conn.cursor()
            if query:
                c.execute('''SELECT id, title, artist, type, tuning, capo, difficulty FROM tabs 
                             WHERE title LIKE ? OR artist LIKE ?''', (f'%{query}%', f'%{query}%'))
            else:
                c.execute('SELECT id, title, artist, type, tuning, capo, difficulty FROM tabs ORDER BY id DESC')
            return c.fetchall()

    def get_tab(self, tab_id):
        with self._connect() as conn:
            c = conn.cursor()
            c.execute('SELECT * FROM tabs WHERE id=?', (tab_id,))
            return c.fetchone()
