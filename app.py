from flask import Flask, jsonify, render_template, request
from db import Database

app = Flask(__name__)
db = Database()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/tabs')
def api_tabs():
    q = request.args.get('q')
    data = db.search_tabs(q)
    # id, title, artist, type, tuning, capo, difficulty
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
    # id, title, artist, type, tuning, capo, difficulty, content
    return jsonify({
        'id': tab[0], 'title': tab[1], 'artist': tab[2], 'type': tab[3],
        'tuning': tab[4], 'capo': tab[5], 'difficulty': tab[6], 'content': tab[7]
    })

if __name__ == "__main__":
    app.run(debug=True)
