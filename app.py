from flask import Flask, jsonify, request, render_template
from db import Database

app = Flask(__name__)
db = Database()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/songs', methods=['GET'])
def get_songs():
    songs = db.get_all_songs()
    return jsonify([{'id': s[0], 'title': s[1], 'artist': s[2]} for s in songs])

@app.route('/api/song/<int:song_id>', methods=['GET'])
def get_song(song_id):
    song = db.get_song(song_id)
    if song:
        return jsonify({'id': song[0], 'title': song[1], 'artist': song[2], 'chords': song[3]})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/song', methods=['POST'])
def add_song():
    data = request.json
    title = data.get('title')
    artist = data.get('artist')
    chords = data.get('chords')
    if not (title and artist and chords):
        return jsonify({'error': 'Missing data'}), 400
    song_id = db.add_song(title, artist, chords)
    return jsonify({'id': song_id}), 201

if __name__ == '__main__':
    app.run(debug=True)
