/* Hut (door) markup, colours and grid sizing — shared by the viewer and the editor. */
(function () {
  const A = (window.Advent = window.Advent || {});

  A.HUT_PALETTES = {
    snow: [
      { wall: '#f3e3c3', wall2: '#e8d3ac', roof: '#7a2e2a', door: '#b23a32', ink: '#fff4dc' },
      { wall: '#c8473d', wall2: '#b43a31', roof: '#24453a', door: '#f3e3c3', ink: '#7a2e2a' },
      { wall: '#2f6b4f', wall2: '#275c43', roof: '#7a2e2a', door: '#e9b949', ink: '#3b2a12' },
      { wall: '#e9b949', wall2: '#dba93a', roof: '#3b2f4a', door: '#2f6b4f', ink: '#fff4dc' },
      { wall: '#3f5a8a', wall2: '#354e79', roof: '#8b3a2f', door: '#f0d6d0', ink: '#3f5a8a' },
      { wall: '#f0d6d0', wall2: '#e6c4bc', roof: '#24453a', door: '#8a4b2a', ink: '#ffe9c2' },
    ],
    summer: [
      { wall: '#ff6f91', wall2: '#ffe3ea', roof: '#e23d66', door: '#2ec4b6', ink: '#fff' },
      { wall: '#2ec4b6', wall2: '#e2fffb', roof: '#14918a', door: '#ff9f1c', ink: '#fff' },
      { wall: '#ffbf3c', wall2: '#fff4d6', roof: '#f08a00', door: '#6a4c93', ink: '#fff' },
      { wall: '#6a8cff', wall2: '#eaf0ff', roof: '#3d5bd9', door: '#ff6f91', ink: '#fff' },
      { wall: '#9b5de5', wall2: '#f3e9ff', roof: '#7032c2', door: '#ffd23f', ink: '#5b2a5f' },
      { wall: '#00bbf9', wall2: '#e4f8ff', roof: '#0090c8', door: '#f15bb5', ink: '#fff' },
    ],
    gingerbread: [
      { wall: '#b8743d', wall2: '#a5652f', roof: '#ff6fa3', door: '#2f9e5b', ink: '#fff4dc' },
      { wall: '#c07a42', wall2: '#a5652f', roof: '#5fd4b0', door: '#e2283a', ink: '#fff4dc' },
      { wall: '#b06c37', wall2: '#a5652f', roof: '#c77dff', door: '#ffd23f', ink: '#5a2a12' },
      { wall: '#bd7840', wall2: '#a5652f', roof: '#ffb347', door: '#9b5de5', ink: '#fff4dc' },
      { wall: '#b8743d', wall2: '#a5652f', roof: '#7fc8ff', door: '#ff6fa3', ink: '#fff4dc' },
      { wall: '#c27c45', wall2: '#a5652f', roof: '#e2483d', door: '#6fc9ff', ink: '#2a2140' },
    ],
    toys: [
      { wall: '#e2483d', wall2: '#ffe3df', roof: '#3f7be0', door: '#ffd23f', ink: '#fff' },
      { wall: '#3f7be0', wall2: '#e3edff', roof: '#ffd23f', door: '#e2483d', ink: '#fff' },
      { wall: '#ffd23f', wall2: '#fff6d6', roof: '#2f9e5b', door: '#3f7be0', ink: '#fff' },
      { wall: '#2f9e5b', wall2: '#e3f7ea', roof: '#ff8a2b', door: '#9b5de5', ink: '#fff' },
      { wall: '#ff8a2b', wall2: '#fff0e3', roof: '#9b5de5', door: '#2f9e5b', ink: '#fff' },
      { wall: '#9b5de5', wall2: '#f3e9ff', roof: '#e2483d', door: '#ffd23f', ink: '#fff' },
    ],
    space: [
      { wall: '#7af7ff', wall2: '#e8fdff', roof: '#5fb8ff', door: '#3d5bd9', ink: '#fff' },
      { wall: '#ff6fd8', wall2: '#ffe8f8', roof: '#a18cff', door: '#e2483d', ink: '#fff' },
      { wall: '#ffd23f', wall2: '#fff6d6', roof: '#4fe0c8', door: '#2ec4b6', ink: '#fff' },
      { wall: '#7cf29a', wall2: '#e8fff0', roof: '#ff8ad8', door: '#9b5de5', ink: '#fff' },
      { wall: '#c77dff', wall2: '#f3e9ff', roof: '#7fd0ff', door: '#ff8a2b', ink: '#fff' },
      { wall: '#ff8a5b', wall2: '#fff0e8', roof: '#b0a8ff', door: '#2a2f3a', ink: '#fff' },
    ],
    workshop: [
      { wall: '#c8372d', wall2: '#b02e25', roof: '#234a3a', door: '#f2b84b', ink: '#5a1e1a' },
      { wall: '#2e6a4f', wall2: '#26593f', roof: '#7a2620', door: '#f7f0e0', ink: '#2e6a4f' },
      { wall: '#f3e3c3', wall2: '#e8d3ac', roof: '#c8372d', door: '#2e6a4f', ink: '#fff4dc' },
      { wall: '#c9862f', wall2: '#b5762a', roof: '#234a3a', door: '#c8372d', ink: '#fff4dc' },
      { wall: '#8e2f3b', wall2: '#7a2832', roof: '#3d3a52', door: '#f2b84b', ink: '#5a1e1a' },
      { wall: '#f7f0e0', wall2: '#ece0c8', roof: '#2e6a4f', door: '#c8372d', ink: '#fff4dc' },
    ],
    jungle: [
      { wall: '#c9a35b', wall2: '#b88a4a', roof: '#8a6a2e', door: '#1f6f6a', ink: '#fff' },
      { wall: '#d8b878', wall2: '#c39555', roof: '#9c7a3a', door: '#d2553a', ink: '#fff' },
      { wall: '#b88a4a', wall2: '#a87a3e', roof: '#7d5f27', door: '#2e5d8a', ink: '#fff' },
      { wall: '#c39555', wall2: '#b88a4a', roof: '#a5843f', door: '#7b3f8c', ink: '#fff' },
      { wall: '#d8b878', wall2: '#c9a35b', roof: '#8a6a2e', door: '#c7781d', ink: '#fff' },
      { wall: '#a87a3e', wall2: '#9a6e36', roof: '#9c7a3a', door: '#2f8a4e', ink: '#fff' },
    ],
    japan: [
      { wall: '#fff4ea', wall2: '#c9958a', roof: '#ff9ec4', door: '#fffaf2', ink: '#ff6f9e', noren: '#8fd3f5' },
      { wall: '#ffe9f1', wall2: '#b98a9a', roof: '#9fd8f5', door: '#fffaf2', ink: '#5aa9e6', noren: '#ff9ec4' },
      { wall: '#eefff7', wall2: '#a8968a', roof: '#b6a4f0', door: '#fffaf2', ink: '#9b7ae6', noren: '#ffd36b' },
      { wall: '#f4efff', wall2: '#b08fa8', roof: '#8fdcc0', door: '#fffaf2', ink: '#3fbf95', noren: '#b6a4f0' },
      { wall: '#fffbe6', wall2: '#c9a08a', roof: '#ffb38a', door: '#fffaf2', ink: '#ff8a5b', noren: '#8fdcc0' },
      { wall: '#fff0f6', wall2: '#a98a9a', roof: '#ffd36b', door: '#fffaf2', ink: '#ff6f9e', noren: '#9fd8f5' },
    ],
    cyber: [
      { wall: '#4a5288', wall2: '#5a63a0', roof: '#ff2bd6', door: '#2b2f45', ink: '#ff2bd6' },
      { wall: '#3a6478', wall2: '#477790', roof: '#00e5ff', door: '#2b2f45', ink: '#00e5ff' },
      { wall: '#5a4a88', wall2: '#6a58a0', roof: '#a6ff00', door: '#2b2f45', ink: '#a6ff00' },
      { wall: '#6a4a68', wall2: '#7a5878', roof: '#ff8a00', door: '#2b2f45', ink: '#ffb000' },
      { wall: '#3f5a8a', wall2: '#4c6aa0', roof: '#7c4dff', door: '#2b2f45', ink: '#b388ff' },
      { wall: '#7a3f5e', wall2: '#8a4c6e', roof: '#ff2b5a', door: '#2b2f45', ink: '#ff4f7a' },
    ],
  };

  // Returns an array of 24 hut <button>s. Same seed => same village every time.
  A.makeHuts = function (theme, iconFor, onClick) {
    const r = A.rng(theme === 'snow' ? 7 : 11);
    const out = [];
    for (let d = 1; d <= 24; d++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hut';
      b.dataset.day = d;
      b.dataset.world = theme;
      b.style.setProperty('--dy', ((r() - 0.5) * 8).toFixed(1) + '%');
      b.style.setProperty('--rot', ((r() - 0.5) * 3).toFixed(2) + 'deg');
      b.style.setProperty('--roof-h', (26 + r() * 12).toFixed(0) + '%');
      b.style.setProperty('--i', d);
      const chimney = theme === 'snow' && r() < 0.35;
      const flag = theme === 'summer' && r() < 0.4;
      b.innerHTML = `
        <span class="hut-body">
          <span class="roof">${chimney ? '<span class="chimney"><span class="smoke"></span></span>' : ''}${flag ? '<span class="flag"></span>' : ''}</span>
          <span class="facade">
            <span class="plaque">${d}</span>
            <span class="doorway">
              <span class="inside"><span class="icon">${iconFor(d)}</span></span>
              <span class="door">
                <span class="door-front"><span class="num">${d}</span><span class="knob"></span></span>
                <span class="door-back"></span>
              </span>
            </span>
          </span>
          <span class="ground"></span>
        </span>
        <span class="today-star" aria-hidden="true">${theme === 'snow' ? '★' : '✹'}</span>`;
      if (onClick) b.addEventListener('click', () => onClick(d, b));
      out.push(b);
    }
    return out;
  };

  A.setHutIcon = function (hut, icon) {
    hut.querySelector('.icon').textContent = icon;
  };

  // Biggest huts that fit the box; also applies colours so neighbours never match.
  A.layoutHuts = function (gridEl, huts, theme, availW, availH, colsOptions = [3, 4, 6, 8, 12]) {
    const ratio = 1.32;
    const vw = window.innerWidth;
    let best = { cols: 4, cw: 0, gap: 10 };
    for (const cols of colsOptions) {
      const rows = 24 / cols;
      const gap = Math.max(6, Math.min(18, vw * 0.012));
      const cw = Math.min((availW - gap * (cols - 1)) / cols, (availH - gap * (rows - 1)) / rows / ratio);
      if (cw > best.cw) best = { cols, cw, gap };
    }
    gridEl.style.setProperty('--cols', best.cols);
    gridEl.style.setProperty('--cw', Math.floor(best.cw) + 'px');
    gridEl.style.setProperty('--gap', best.gap + 'px');
    const pal = A.HUT_PALETTES[theme];
    huts.forEach((h, i) => {
      const col = i % best.cols, row = Math.floor(i / best.cols);
      const p = pal[(col * 5 + row * 2) % pal.length];
      h.style.setProperty('--wall', p.wall);
      h.style.setProperty('--wall2', p.wall2);
      h.style.setProperty('--roof', p.roof);
      h.style.setProperty('--door', p.door);
      h.style.setProperty('--door-ink', p.ink);
      h.style.setProperty('--noren', p.noren || p.roof);
    });
    return best;
  };
})();
