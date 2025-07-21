import sqlite3

class Database:
    def __init__(self, db_path='chords.db'):
        self.db_path = db_path
        self._init_db()

    def _connect(self):
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        with self._connect() as conn:
            c = conn.cursor()
            c.execute('''
                CREATE TABLE IF NOT EXISTS songs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    artist TEXT NOT NULL,
                    chords TEXT NOT NULL
                )
            ''')
            conn.commit()

    def get_all_songs(self):
        with self._connect() as conn:
            c = conn.cursor()
            c.execute('SELECT id, title, artist FROM songs')
            return c.fetchall()

    def get_song(self, song_id):
        with self._connect() as conn:
            c = conn.cursor()
            c.execute('SELECT * FROM songs WHERE id=?', (song_id,))
            return c.fetchone()

    def add_song(self, title, artist, chords):
        with self._connect() as conn:
            c = conn.cursor()
            c.execute('INSERT INTO songs (title, artist, chords) VALUES (?, ?, ?)', (title, artist, chords))
            conn.commit()
            return c.lastrowid
