/* 메이드 입구 v0.2-draft
   - 코드는 서버(Apps Script)에서만 검증한다. 맞을 때만 서버가 앱 주소를 응답한다.
   - 이 입구는 "발견 가능성을 낮추는 문"이다. 실질 방어는 앱 백엔드가 코드·토큰을 요구하도록 고치는 것. */
(function () {
  'use strict';
  var C = window.MAID_CONFIG;
  var $ = function (s) { return document.querySelector(s); };
  var KEY = 'maid.session.v1';
  var params = new URLSearchParams(location.search);
  var isLocal = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

  var tone = window.Skyline.toneForHour(new Date().getHours());
  var reqTone = isLocal ? params.get('tone') : null;
  if (window.Skyline.TONES.indexOf(reqTone) >= 0) tone = reqTone;
  document.documentElement.dataset.tone = tone;
  window.Skyline.render($('#bldg'), tone);

  function setMsg(t, info) { var el = $('#code-msg'); el.textContent = t || ''; el.classList.toggle('info', !!info); }
  function view(name) { $('#view-code').hidden = name !== 'code'; $('#view-home').hidden = name !== 'home'; }

  /* 서버가 준 urls 중, 설정에 있는 앱 id + https 주소만 타일로 만든다 */
  function renderHome(urls) {
    var apps = C.APPS.map(function (a) {
      var u = urls && Object.prototype.hasOwnProperty.call(urls, a.id) ? urls[a.id] : null;
      return { id: a.id, title: a.title + ' · ' + a.titleEn, desc: a.desc + ' / ' + a.descEn, icon: a.icon, url: u };
    });
    window.Tiles.render($('#tiles'), apps, { large: true, pendingLabel: '준비 중 / Not ready' });
    view('home');
  }

  function saveSession(urls) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ exp: Date.now() + C.SESSION_HOURS * 3600e3, urls: urls })); } catch (e) { /* 저장 불가: 새로고침 시 다시 입력 */ }
  }
  function clearSession() { try { sessionStorage.removeItem(KEY); } catch (e) { /* noop */ } }
  function loadSession() {
    try {
      var s = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      if (s && typeof s.exp === 'number' && s.exp > Date.now() && s.urls && typeof s.urls === 'object') return s.urls;
    } catch (e) { /* 손상된 값 무시 */ }
    clearSession();
    return null;
  }

  /* 화면 잠금(보조): 5회 실패 시 60초 */
  var fails = 0, lockedUntil = 0, lockTimer = null;
  function tickLock() {
    var left = Math.ceil((lockedUntil - Date.now()) / 1000), btn = $('#code-btn');
    if (left > 0) { btn.disabled = true; setMsg(left + '초 뒤에 다시 입력할 수 있어요. / Try again in ' + left + 's.'); return; }
    clearInterval(lockTimer); lockTimer = null; btn.disabled = false; fails = 0; setMsg('');
  }
  function lock() { lockedUntil = Date.now() + C.LOCK_SECONDS * 1000; tickLock(); lockTimer = setInterval(tickLock, 1000); }

  async function verify(code) {
    var ctrl = new AbortController(), to = setTimeout(function () { ctrl.abort(); }, 15000);
    try {
      var res = await fetch(C.CODE_VERIFY_URL, {            // text/plain: CORS 사전 요청 회피
        method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ code: code }), signal: ctrl.signal, redirect: 'follow', credentials: 'omit'
      });
      if (!res.ok) return { net: true };
      return await res.json();
    } catch (e) { return { net: true }; } finally { clearTimeout(to); }
  }

  $('#code-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    if (Date.now() < lockedUntil) return;
    var code = $('#code').value.replace(/\s/g, '');
    if (!C.CODE_VERIFY_URL) return setMsg('지금은 들어갈 수 없어요. 점장에게 문의해 주세요. / Not available now. Please ask your manager.');
    if (!/^\d{6}$/.test(code)) return setMsg('숫자 6자리를 입력해 주세요. / Enter 6 digits.');
    var btn = $('#code-btn'); btn.disabled = true; setMsg('확인하고 있어요… / Checking…', true);
    var r = await verify(code);
    $('#code').value = '';
    btn.disabled = false;
    if (r && r.ok === true && r.urls && typeof r.urls === 'object') { fails = 0; setMsg(''); saveSession(r.urls); renderHome(r.urls); return; }
    if (r && r.net) return setMsg('연결이 불안정해요. 다시 시도해 주세요. / Connection problem. Please retry.');
    if (r && r.reason === 'locked') return setMsg('잠시 뒤에 다시 시도해 주세요. / Please try again in a few minutes.');
    if (r && r.reason === 'bad_request') return setMsg('숫자 6자리를 입력해 주세요. / Enter 6 digits.');
    fails += 1;
    if (fails >= C.MAX_LOCAL_FAILS) return lock();
    setMsg('코드가 맞지 않아요. 다시 확인해 주세요. / Wrong code. Please check again.');
  });

  $('#exit').addEventListener('click', function () { clearSession(); $('#tiles').textContent = ''; view('code'); });

  /* 시작 */
  if (C.ALLOW_PREVIEW && isLocal && params.get('preview') === 'maid') {
    renderHome({ 'hk-maid': 'https://example.com/hk-preview', attendance: 'https://example.com/attendance-preview' });
  } else {
    var saved = loadSession();
    if (saved) renderHome(saved);
    else if (!C.CODE_VERIFY_URL) setMsg('지금은 들어갈 수 없어요. 점장에게 문의해 주세요. / Not available now. Please ask your manager.');
  }
})();
