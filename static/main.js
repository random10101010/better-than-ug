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
