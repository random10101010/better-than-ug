from flask import Flask, jsonify, render_template, request
from db import Database, clean_tab_text

app = Flask(__name__)
db = Database()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/tabs')
def api_tabs():
    q = request.args.get('q')
    data = db.search_tabs(q)
    res = []
    for row in data:
        res.append({
            'id': row[0], 'title': row[1], 'artist': row[2], 'type': row[3],
            'tuning': row[4], 'capo': row[5], 'difficulty': row[6]
        })
    return jsonify(res)

@app.route('/api/tab/<int:tab_id>')
def api_tab(tab_id):
    tab = db.get_tab(tab_id)
    if not tab:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({
        'id': tab[0], 'title': tab[1], 'artist': tab[2], 'type': tab[3],
        'tuning': tab[4], 'capo': tab[5], 'difficulty': tab[6], 'content': tab[7]
    })

@app.route('/api/import_tab', methods=['POST'])
def import_tab():
    title = request.form.get('title')
    artist = request.form.get('artist')
    type_ = request.form.get('type', 'Tab')
    tuning = request.form.get('tuning', 'Standard')
    capo = request.form.get('capo', '')
    difficulty = request.form.get('difficulty', 'Intermediate')
    tabfile = request.files.get('tabfile')
    if not (title and artist and tabfile):
        return jsonify({'error': 'Missing fields'}), 400
    content = tabfile.read().decode('utf-8')
    content = clean_tab_text(content)
    tab_id = db.add_tab(title, artist, type_, tuning, capo, difficulty, content)
    return jsonify({'id': tab_id}), 201

if __name__ == "__main__":
    app.run(debug=True)
