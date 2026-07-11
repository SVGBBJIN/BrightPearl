

    // ── Rich text formatting toolbar ────────────────
    export function showFormatToolbar($body) {
      if ($body.previousElementSibling?.classList.contains('format-toolbar')) return;
      const toolbar = document.createElement('div');
      toolbar.className = 'format-toolbar';
      toolbar.innerHTML = `
        <button class="format-btn" data-cmd="bold" title="Bold"><b>B</b></button>
        <button class="format-btn" data-cmd="italic" title="Italic"><i>I</i></button>
        <button class="format-btn" data-cmd="insertUnorderedList" title="Bullet list">&#8226; List</button>
        <button class="format-btn" data-cmd="table" title="Insert table">&#9783; Table</button>
        <span class="format-sep"></span>
        <button class="format-btn" data-cmd="table-add-row" title="Add row below (cursor must be in a table)">+ Row</button>
        <button class="format-btn" data-cmd="table-add-col" title="Add column to the right (cursor must be in a table)">+ Col</button>
        <button class="format-btn" data-cmd="table-remove-row" title="Remove current row">&#8722; Row</button>
        <button class="format-btn" data-cmd="table-remove-col" title="Remove current column">&#8722; Col</button>
        <button class="format-btn" data-cmd="table-delete" title="Delete entire table">&#128465; Table</button>`;
      toolbar.addEventListener('mousedown', e => {
        e.preventDefault();
        const btn = e.target.closest('[data-cmd]');
        if (!btn) return;
        const cmd = btn.dataset.cmd;
        $body.focus();
        if (cmd === 'table') {
          document.execCommand('insertHTML', false,
            '<table><thead><tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr></thead>' +
            '<tbody><tr><td>Cell</td><td>Cell</td><td>Cell</td></tr>' +
            '<tr><td>Cell</td><td>Cell</td><td>Cell</td></tr></tbody></table>');
        } else {
          const sel = window.getSelection();
          const node = sel.rangeCount ? sel.getRangeAt(0).startContainer : null;
          const cell = node ? (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement)?.closest('td,th') : null;
          const table = cell?.closest('table');
          if (cmd === 'table-add-row') {
            if (cell) {
              const row = cell.closest('tr');
              const colCount = row.cells.length;
              const newRow = document.createElement('tr');
              for (let i = 0; i < colCount; i++) {
                const td = document.createElement('td'); td.textContent = 'Cell'; newRow.appendChild(td);
              }
              row.after(newRow);
            }
          } else if (cmd === 'table-add-col') {
            if (table && cell) {
              const colIdx = cell.cellIndex;
              Array.from(table.querySelectorAll('tr')).forEach((tr, i) => {
                const newCell = document.createElement(i === 0 && tr.closest('thead') ? 'th' : 'td');
                newCell.textContent = i === 0 && tr.closest('thead') ? 'Header' : 'Cell';
                if (tr.cells[colIdx]) tr.cells[colIdx].after(newCell);
                else tr.appendChild(newCell);
              });
            }
          } else if (cmd === 'table-remove-row') {
            if (cell) {
              const row = cell.closest('tr');
              if (table.querySelectorAll('tr').length > 1) row.remove();
              else table.remove();
            }
          } else if (cmd === 'table-remove-col') {
            if (table && cell) {
              const colIdx = cell.cellIndex;
              Array.from(table.querySelectorAll('tr')).forEach(tr => {
                if (tr.cells[colIdx]) tr.cells[colIdx].remove();
              });
              if (!table.querySelector('td,th')) table.remove();
            }
          } else if (cmd === 'table-delete') {
            if (table) table.remove();
          } else {
            document.execCommand(cmd, false, null);
          }
        }
      });
      $body.parentNode.insertBefore(toolbar, $body);
    }

    // ── Utility ────────────────────────────────────
    export function esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
    export function sanitizeHtml(html) {
      if (!html) return '';
      const allowed = new Set(['b','i','em','strong','ul','ol','li','br','p','table','thead','tbody','tr','td','th']);
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      (function clean(node) {
        Array.from(node.childNodes).forEach(child => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            if (!allowed.has(child.tagName.toLowerCase())) {
              child.replaceWith(...child.childNodes);
            } else {
              Array.from(child.attributes).forEach(a => child.removeAttribute(a.name));
              clean(child);
            }
          }
        });
      })(tmp);
      return tmp.innerHTML;
    }
    export function getYouTubeId(url) {
      const m = (url || '').match(
        /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      );
      return m ? m[1] : null;
    }
    function isYouTubeUrl(url) { return !!getYouTubeId(url); }
    export function isVideoUrl(url) { return isYouTubeUrl(url); }