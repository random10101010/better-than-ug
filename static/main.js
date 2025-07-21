// --- Helper ---
async function api(url) {
    const res = await fetch(url);
    return res.json();
}

// --- Tab Importer ---
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
                msg.style.color = "#17a317";
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

// --- Tab List ---
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

// --- Tab Detail ---
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
            <pre style="white-space:pre-wrap;font-family:monospace;background:#f8f8f8;padding:16px;border-radius:8px;font-size:1em;margin-top:10px;margin-bottom:0;overflow-x:auto;">${tab.content}</pre>
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

// --- Guitar Tab Canvas (WebGL Component) ---
class GuitarTabCanvas extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.tabData = ''; // should be set with setTabData()
    this.width = 1000;
    this.height = 200;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.shadowRoot.appendChild(this.canvas);
  }

  connectedCallback() {
    if (this.tabData) this.renderTab();
  }

  setTabData(tab) {
    this.tabData = tab;
    this.renderTab();
  }

  renderTab() {
    // 1. Draw on an offscreen 2D canvas
    const offCanvas = document.createElement('canvas');
    offCanvas.width = this.width;
    offCanvas.height = this.height;
    const ctx = offCanvas.getContext('2d');
    ctx.clearRect(0,0,this.width,this.height);

    // Styles
    ctx.fillStyle = "#232323";
    ctx.fillRect(0, 0, this.width, this.height);

    // Music details (can be parameterised)
    const tempo = 174;
    const timeSig = "4/4";

    // Tab parsing
    let lines = this.tabData.split('\n').filter(l => l.trim().length > 0);
    // Only tab lines with pipes or hyphens
    let tabLines = lines.filter(line => line.match(/^[EADGBe]\|/i));
    let nStrings = tabLines.length;
    if (nStrings < 6) nStrings = 6;
    let lineSpacing = 25;
    let startY = 40;
    let leftPad = 60;
    let rightPad = 30;
    let tabLength = tabLines.length > 0 ? tabLines[0].length : 80;
    let noteSpacing = Math.floor((this.width - leftPad - rightPad) / (tabLength - 2)); // exclude "E|"

    // 2. Draw grid (strings)
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      let y = startY + i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(leftPad, y);
      ctx.lineTo(this.width - rightPad, y);
      ctx.stroke();
    }

    // 3. Draw vertical bars (for measures)
    let nBars = Math.floor((tabLength-2)/8);
    ctx.strokeStyle = "#999";
    ctx.lineWidth = 1.5;
    for (let b = 0; b <= nBars; b++) {
      let x = leftPad + b*8*noteSpacing;
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + 5*lineSpacing);
      ctx.stroke();
    }

    // 4. String labels
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#c1ff78";
    let stringNames = ['E','B','G','D','A','E'];
    for (let i = 0; i < 6; i++) {
      ctx.fillText(stringNames[i], leftPad-30, startY + i*lineSpacing + 5);
    }

    // 5. Time signature and tempo
    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px Arial";
    ctx.fillText(timeSig, leftPad-15, startY + 2*lineSpacing);
    ctx.font = "16px Arial";
    ctx.fillText("♩ = " + tempo, leftPad-10, startY-12);

    // 6. Parse tab lines for notes
    ctx.font = "16px monospace";
    for (let s = 0; s < tabLines.length && s < 6; s++) {
      let line = tabLines[s];
      for (let i = 2; i < line.length; i++) { // skip 'E|'
        let char = line[i];
        let x = leftPad + (i-2)*noteSpacing;
        let y = startY + s*lineSpacing;
        if (char !== '-' && char !== '|') {
          ctx.fillStyle = "#fff";
          ctx.fillText(char, x-2, y-5);
        }
      }
    }

    // 7. Transfer 2D canvas to WebGL as a texture
    const gl = this.canvas.getContext('webgl');
    if (!gl) {
      this.canvas.getContext('2d').drawImage(offCanvas,0,0);
      return; // fallback: just draw as bitmap
    }
    // WebGL: Basic textured quad
    gl.viewport(0,0,this.width,this.height);
    gl.clearColor(0,0,0,0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Create texture
    let tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // Set up shaders and quad (boilerplate)
    const vert = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
      }
    `;
    const frag = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      void main() {
        gl_FragColor = texture2D(u_image, v_texCoord);
      }
    `;

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const program = gl.createProgram();
    const vshader = createShader(gl, gl.VERTEX_SHADER, vert);
    const fshader = createShader(gl, gl.FRAGMENT_SHADER, frag);
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Quad covering the whole canvas
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  0, 0,
       1, -1,  1, 0,
      -1,  1,  0, 1,
      -1,  1,  0, 1,
       1, -1,  1, 0,
       1,  1,  1, 1
    ]), gl.STATIC_DRAW);

    const apos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(apos);
    gl.vertexAttribPointer(apos, 2, gl.FLOAT, false, 16, 0);
    const atex = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(atex);
    gl.vertexAttribPointer(atex, 2, gl.FLOAT, false, 16, 8);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    // Done!
  }
}
customElements.define('guitar-tab-canvas', GuitarTabCanvas);

// Example usage for WebGL component:
// window.renderTabExample = function(tabText) {
//   let el = document.querySelector('guitar-tab-canvas');
//   el.setTabData(tabText);
// };
