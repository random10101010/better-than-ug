import sqlite3
import re

def clean_tab_text(raw_text):
    """
    Extract only the lines that are part of the tab (e.g., E|--- lines, chord names, and section headers),
    remove emails, dates, blank lines, and comments.
    """
    lines = raw_text.splitlines()
    cleaned = []
    in_tab_block = False

    # Patterns
    tab_line_re = re.compile(r"^[EADGBe]\|[-0-9xX|hpsb\/\\()~\s]*$", re.IGNORECASE)
    section_header_re = re.compile(r"^\[.*\]$")  # [Intro], [Verse], etc.
    chord_line_re = re.compile(r"^([A-G][#bm0-9\/\s]*){2,}$")  # rough chord line
    ignore_re = re.compile(r"(@|\bemail\b|^\s*$|^\d{1,2}/\d{1,2}|^\d{1,2}-\d{1,2}-\d{2,4}|^\w+@\w+\.\w+)", re.I)

    for line in lines:
        if ignore_re.search(line):
            continue
        if section_header_re.match(line) or tab_line_re.match(line):
            cleaned.append(line)
            in_tab_block = True
        elif in_tab_block and not line.strip():
            # Blank line, end of a tab block
            in_tab_block = False
            cleaned.append('')
        elif chord_line_re.match(line.strip()):
            cleaned.append(line)
        elif in_tab_block:
            # Keep lines until end of tab block
            cleaned.append(line)
    # Remove leading/trailing blanks
    cleaned = [l.rstrip() for l in cleaned if l.strip() != '']
    return "\n".join(cleaned)

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
                    ("Wonderwall", "Oasis", "Chords", "", "2", "Beginner", "[Intro]\ne|------------------------|\nB|------------------------|\nG|------9-------9----7--6-|\nD|--7-------7-------------|\nA|--7---10------9---8-----|\nE|------------------------|"),
                    ("Hotel California", "Eagles", "Tab", "Standard", "", "Intermediate", "[Intro]\ne|------------------------|\nB|------------------------|\nG|--9----7----5-----------|\nD|------------------------|\nA|------------------------|\nE|------------------------|"),
                    ("Nothing Else Matters", "Metallica", "Tab", "Standard", "", "Advanced", "[Intro]\ne|------------------------|\nB|------------------------|\nG|--0---2---4---5---------|\nD|------------------------|\nA|------------------------|\nE|------------------------|"),
                    ("Riptide", "Vance Joy", "Chords", "", "1", "Beginner", "[Verse]\nAm    G    C    F\nAm    G    C    F\n"),
                    ("Tears in Heaven", "Eric Clapton", "Tab", "Standard", "", "Intermediate", "[Chorus]\ne|------------------------|\nB|------------------------|\nG|------9-------9---------|\nD|--7-------7-------------|\nA|--7---10------9---------|\nE|------------------------|")
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

    def add_tab(self, title, artist, type_, tuning, capo, difficulty, content):
        with self._connect() as conn:
            c = conn.cursor()
            c.execute('''
                INSERT INTO tabs (title, artist, type, tuning, capo, difficulty, content)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (title, artist, type_, tuning, capo, difficulty, content))
            conn.commit()
            return c.lastrowid

    def clean_all_tabs(self):
        with sqlite3.connect(self.db_path) as conn:
            c = conn.cursor()
            c.execute('SELECT id, content FROM tabs')
            tabs = c.fetchall()
            for tab_id, content in tabs:
                cleaned = clean_tab_text(content)
                c.execute('UPDATE tabs SET content=? WHERE id=?', (cleaned, tab_id))
            conn.commit()
