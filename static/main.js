// Helper for fetch requests
async function api(url) {
    const res = await fetch(url);
    return res.json();
}

class TabList extends HTMLElement {
    constructor() {
        super();
        this.tabs = [];
        this.attachShadow({mode:'open'});
    }
    connectedCallback() {
        this.render();
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.loadTabs(e.target.value);
        });
        this.loadTabs();
    }
    async loadTabs(query="") {
        let url = '/api/tabs' + (query ? `?q=${encodeURIComponent(query)}` : '');
        this.tabs = await api(url);
        this.render();
    }
    render() {
        let html = `<ul class="tab-list">`;
        if (this.tabs.length === 0) {
            html += `<li class="tab-item">No tabs found.</li>`;
        }
        for (let tab of this.tabs) {
            html += `
            <li class="tab-item">
              <div class="tab-title">${tab.title} – ${tab.artist}</div>
              <div class="tab-meta">
                ${tab.type} 
                ${tab.tuning ? '| ' + tab.tuning : ''} 
                ${tab.capo ? '| Capo: ' + tab.capo : ''} 
                | Difficulty: ${tab.difficulty}
              </div>
              <div class="tab-actions">
                <button data-id="${tab.id}" class="view-btn">View Tab</button>
                <button data-id="${tab.id}" class="fav-btn">Add to Favourites</button>
              </div>
            </li>
            `;
        }
        html += `</ul>`;
        this.shadowRoot.innerHTML = html;

        this.shadowRoot.querySelectorAll('.view-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelector('tab-detail').show(btn.dataset.id);
            };
        });
        this.shadowRoot.querySelectorAll('.fav-btn').forEach(btn => {
            btn.onclick = () => {
                alert("Added to favourites!");
            };
        });
    }
}
customElements.define('tab-list', TabList);

class TabDetail extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode:'open'});
    }
    async show(tabId) {
        const tab = await api('/api/tab/' + tabId);
        if (tab.error) return;
        let html = `
        <div style="padding:24px;border-radius:10px;background:#fff;box-shadow:0 2px 8px #0002;margin-top:16px;">
            <h2 style="margin-bottom:4px">${tab.title} <span style="font-size:0.7em;font-weight:normal">by ${tab.artist}</span></h2>
            <div style="color:#666;margin-bottom:12px;font-size:0.96em;">
                ${tab.type} 
                ${tab.tuning ? '| ' + tab.tuning : ''} 
                ${tab.capo ? '| Capo: ' + tab.capo : ''} 
                | Difficulty: ${tab.difficulty}
            </div>
            <pre style="white-space:pre-wrap;font-family:monospace;background:#f8f8f8;padding:16px;border-radius:8px;font-size:1em">${tab.content}</pre>
            <button style="margin-top:10px;background:#ffd700;border:none;padding:8px 16px;border-radius:5px;cursor:pointer" id="closeBtn">Close</button>
        </div>
        `;
        this.shadowRoot.innerHTML = html;
        this.style.display = 'block';
        this.shadowRoot.getElementById('closeBtn').onclick = () => {
            this.shadowRoot.innerHTML = '';
            this.style.display = 'none';
        };
    }
}
customElements.define('tab-detail', TabDetail);


class TabImport extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode:'open'});
    }
    connectedCallback() {
        this.render();
    }
    render() {
        this.shadowRoot.innerHTML = `
            <form id="importForm" style="background:#f9f9f9;padding:18px 20px 12px 20px;border-radius:10px;box-shadow:0 2px 6px #0001;margin-bottom:28px;">
                <h3 style="margin-top:0;margin-bottom:16px;color:#222;">Import Guitar Tab</h3>
                <div style="margin-bottom:10px;">
                  <label>Song Title<br><input name="title" required style="width:100%;padding:7px;margin-top:3px;"></label>
                </div>
                <div style="margin-bottom:10px;">
                  <label>Artist<br><input name="artist" required style="width:100%;padding:7px;margin-top:3px;"></label>
                </div>
                <div style="margin-bottom:10px;">
                  <label>Type<br>
                    <select name="type" style="width:100%;padding:7px;">
                      <option value="Tab">Tab</option>
                      <option value="Chords">Chords</option>
                    </select>
                  </label>
                </div>
                <div style="margin-bottom:10px;">
                  <label>Tuning<br><input name="tuning" placeholder="Standard" style="width:100%;padding:7px;margin-top:3px;"></label>
                </div>
                <div style="margin-bottom:10px;">
                  <label>Capo<br><input name="capo" placeholder="e.g. 2" style="width:100%;padding:7px;margin-top:3px;"></label>
                </div>
                <div style="margin-bottom:10px;">
                  <label>Difficulty<br>
                    <select name="difficulty" style="width:100%;padding:7px;">
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Advanced</option>
                    </select>
                  </label>
                </div>
                <div style="margin-bottom:10px;">
                  <label>Tab Text File (.txt)<br><input type="file" name="tabfile" accept=".txt" required></label>
                </div>
                <button type="submit" class="btn" style="margin-top:6px;">Import Tab</button>
                <span id="importMsg" style="margin-left:18px;font-size:1em;color:#17a317"></span>
            </form>
        `;

        const form = this.shadowRoot.getElementById('importForm');
        const msg = this.shadowRoot.getElementById('importMsg');
        form.onsubmit = async (e) => {
            e.preventDefault();
            msg.textContent = "";
            const fd = new FormData(form);
            const resp = await fetch('/api/import_tab', {
                method: 'POST',
                body: fd
            });
            if (resp.ok) {
                msg.textContent = "Tab imported!";
                form.reset();
                // Refresh the list
                document.querySelector('tab-list').loadTabs();
            } else {
                const error = await resp.json();
                msg.textContent = "Error: " + (error.error || "Import failed");
                msg.style.color = "#c31";
            }
        };
    }
}
customElements.define('tab-import', TabImport);
