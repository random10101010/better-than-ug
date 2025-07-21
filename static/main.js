// Helper for fetching
async function api(url, method = 'GET', data = null) {
    let options = { method, headers: {'Content-Type': 'application/json'} };
    if (data) options.body = JSON.stringify(data);
    let res = await fetch(url, options);
    return res.json();
}

// Custom Element: Song List
class SongList extends HTMLElement {
    connectedCallback() {
        this.load();
    }

    async load() {
        const songs = await api('/api/songs');
        this.innerHTML = `
            <ul class="list-group">
                ${songs.map(song =>
                    `<li class="list-group-item" data-id="${song.id}">
                        <strong>${song.title}</strong> <small>by ${song.artist}</small>
                    </li>`
                ).join('')}
            </ul>
        `;
        this.querySelectorAll('.list-group-item').forEach(item => {
            item.onclick = () => {
                document.querySelector('song-detail').show(item.dataset.id);
            }
        });
    }
}
customElements.define('song-list', SongList);

// Custom Element: Song Detail
class SongDetail extends HTMLElement {
    async show(id) {
        const detail = await api(`/api/song/${id}`);
        if (detail.error) return;
        this.style.display = 'block';
        this.innerHTML = `
            <h3>${detail.title} <small>by ${detail.artist}</small></h3>
            <pre style="background:#fff;padding:1rem;border-radius:0.375rem">${detail.chords}</pre>
            <button class="btn" id="close-detail">Close</button>
        `;
        document.getElementById('close-detail').onclick = () => {
            this.style.display = 'none';
        };
    }
}
customElements.define('song-detail', SongDetail);

// Custom Element: Add Song Form
class AddSongForm extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = `
            <form id="add-song-form">
                <h3>Add a Song</h3>
                <div class="form-group">
                    <input type="text" id="song-title" placeholder="Title" required>
                </div>
                <div class="form-group">
                    <input type="text" id="song-artist" placeholder="Artist" required>
                </div>
                <div class="form-group">
                    <textarea id="song-chords" rows="4" placeholder="Chords..." required></textarea>
                </div>
                <button class="btn" type="submit">Add Song</button>
            </form>
        `;
        this.querySelector('form').onsubmit = async e => {
            e.preventDefault();
            const title = this.querySelector('#song-title').value;
            const artist = this.querySelector('#song-artist').value;
            const chords = this.querySelector('#song-chords').value;
            await api('/api/song', 'POST', { title, artist, chords });
            document.querySelector('song-list').load();
            this.querySelector('form').reset();
        };
    }
}
customElements.define('add-song-form', AddSongForm);
