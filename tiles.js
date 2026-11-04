/* 앱 타일 렌더러 (직원 포털·메이드 입구 공용). 모든 앱은 새 탭으로 열린다. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var ICONS = {
    rsv: ['M4 6h16v13H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4', 'M8 14h3'],
    hk: ['M3 18V8', 'M3 14h18v4', 'M21 14v-2a3 3 0 0 0-3-3h-7v5', 'M6.5 11.5h.01'],
    clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2']
  };

  function icon(name) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    (ICONS[name] || ICONS.rsv).forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      svg.appendChild(p);
    });
    return svg;
  }

  function safeUrl(u) {                                  // https만 허용
    try { var x = new URL(u); return x.protocol === 'https:' ? x.href : null; } catch (e) { return null; }
  }

  // apps: [{id,title,desc,icon,url}] / opts: {large:boolean, pendingLabel:string}
  function render(container, apps, opts) {
    opts = opts || {};
    container.textContent = '';
    container.classList.toggle('lg', !!opts.large);
    apps.forEach(function (app) {
      var href = safeUrl(app.url), tile;
      if (href) {
        tile = document.createElement('a');
        tile.href = href; tile.target = '_blank'; tile.rel = 'noopener noreferrer';
      } else {
        tile = document.createElement('button');
        tile.type = 'button'; tile.disabled = true;
      }
      tile.className = 'tile';
      tile.dataset.app = app.id;
      tile.appendChild(icon(app.icon));
      var label = document.createElement('span');
      var t = document.createElement('span'); t.className = 't'; t.textContent = app.title;
      var d = document.createElement('span'); d.className = 'd';
      d.textContent = href ? (app.desc || '') : (opts.pendingLabel || '준비 중');
      label.appendChild(t); label.appendChild(d);
      tile.appendChild(label);
      container.appendChild(tile);
    });
    return container.children.length;
  }

  window.Tiles = { render: render, safeUrl: safeUrl };
})();
