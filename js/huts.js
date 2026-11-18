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
    });
    return best;
  };
})();
