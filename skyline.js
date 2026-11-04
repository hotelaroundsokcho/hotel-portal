/* 어라운드 속초 — 객실 47개 창 시그니처 (장식용. 실제 객실 점유 상태가 아님) */
(function () {
  'use strict';
  var COLS = 12, ROWS = 4, TOTAL = COLS * ROWS;          // 48칸 = 창 47 + 출입문 1
  var DOOR = TOTAL - (COLS / 2);                         // 1층 가운데
  var TONES = ['night', 'dusk', 'dawn', 'day'];
  var LIT_RATIO = { night: 0.62, dusk: 0.45, dawn: 0.2, day: 0.08 };

  function toneForHour(h) {
    if (h >= 21 || h < 5) return 'night';
    if (h < 8) return 'dawn';
    if (h < 17) return 'day';
    return 'dusk';
  }

  function rng(seed) {                                    // mulberry32: 같은 날·톤이면 같은 배치
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seedFrom(tone) {
    var d = new Date(), s = d.getFullYear() * 1000 + d.getMonth() * 40 + d.getDate();
    return s * 7 + TONES.indexOf(tone) * 131;
  }

  function level(r) { return r < 0.6 ? 1 : (r < 0.9 ? 2 : 3); }

  var timer = null;

  function render(el, tone) {
    if (!el) return 0;
    var rand = rng(seedFrom(tone)), ratio = LIT_RATIO[tone] || 0.3, i, cell, wins = [];
    el.textContent = '';
    for (i = 0; i < TOTAL; i++) {
      cell = document.createElement('div');
      if (i === DOOR) { cell.className = 'door'; }
      else {
        cell.className = 'win' + (rand() < ratio ? ' l' + level(rand()) : '');
        wins.push(cell);
      }
      el.appendChild(cell);
    }
    el.dataset.windows = String(wins.length);
    if (timer) { clearInterval(timer); timer = null; }
    if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      timer = setInterval(function () {                  // 모션: 4초마다 창 하나가 조용히 켜지고 꺼짐
        var w = wins[Math.floor(Math.random() * wins.length)];
        if (!w) return;
        if (/\bl[123]\b/.test(w.className)) w.className = 'win';
        else w.className = 'win l' + level(Math.random());
      }, 4000);
    }
    return wins.length;
  }

  window.Skyline = { toneForHour: toneForHour, render: render, TONES: TONES };
})();
