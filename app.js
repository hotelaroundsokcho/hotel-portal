/* 직원 포털 v0.4-draft
   - 로그인: ID → ID@LOGIN_DOMAIN 으로 Firebase 로그인 → staff/{uid} 실시간 구독
   - 문서 없음 / active 거짓 / 허용 외 role → 즉시 로그아웃 (fail-closed)
   - 화면 분기는 접근 통제가 아니다. 실제 보호는 각 앱 로그인과 Firestore 규칙이 담당한다. */
const C = window.PORTAL_CONFIG;
const $ = (s) => document.querySelector(s);
const FB_VER = '10.14.1';
const ID_RE = /^[a-z0-9._-]{3,32}$/i;

const params = new URLSearchParams(location.search);
const isLocal = location.protocol === 'file:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';

function show(name) {
  for (const v of ['wait', 'login', 'home']) $('#view-' + v).hidden = v !== name;
}

function setMsg(text, info) {
  const el = $('#login-msg');
  el.textContent = text || '';
  el.classList.toggle('info', !!info);
}

/* 시간대 톤 (미리보기 때만 ?tone= 허용) */
const requestedTone = isLocal ? params.get('tone') : null;
const tone = window.Skyline.TONES.includes(requestedTone) ? requestedTone : window.Skyline.toneForHour(new Date().getHours());
document.documentElement.dataset.tone = tone;
window.Skyline.render($('#bldg'), tone);

function greeting() {
  const h = new Date().getHours();
  return h < 5 ? '늦은 시간이네요' : h < 12 ? '좋은 아침이에요' : h < 18 ? '안녕하세요' : '수고 많으셨어요';
}

function renderHome(staff) {
  const name = typeof staff.name === 'string' && staff.name.trim() ? staff.name.trim() : '직원';
  $('#greet').textContent = greeting() + ', ' + name + '님';
  const apps = C.APPS.filter((a) => a.roles.includes(staff.role));
  window.Tiles.render($('#tiles'), apps, { pendingLabel: '준비 중' });
  show('home');
}

/* 미리보기: 로컬에서만, 로그인 없이 메뉴 화면 확인용 */
if (C.ALLOW_PREVIEW && isLocal && params.get('preview') === 'staff') {
  renderHome({ name: '미리보기', role: 'admin' });
} else {
  startAuth();
}

async function startAuth() {
  show('wait');
  let fb;
  try {
    const base = 'https://www.gstatic.com/firebasejs/' + FB_VER + '/';
    const [app, auth, fs] = await Promise.all([
      import(base + 'firebase-app.js'),
      import(base + 'firebase-auth.js'),
      import(base + 'firebase-firestore.js')
    ]);
    const a = app.initializeApp(C.FIREBASE);
    fb = { auth: auth.getAuth(a), db: fs.getFirestore(a), A: auth, F: fs };
  } catch (e) {
    show('login');
    setMsg('연결하지 못했어요. 네트워크를 확인한 뒤 새로고침해 주세요.');
    return; // 로그인 버튼은 비활성 유지 (fail-closed)
  }

  let unsubStaff = null;
  const stopStaff = () => { if (unsubStaff) { unsubStaff(); unsubStaff = null; } };

  async function deny(message) {
    stopStaff();
    try { await fb.A.signOut(fb.auth); } catch (e) { /* 이미 로그아웃 상태 */ }
    show('login');
    $('#login-btn').disabled = false;
    setMsg(message);
  }

  fb.A.onAuthStateChanged(fb.auth, (user) => {
    stopStaff();
    if (!user) { show('login'); $('#login-btn').disabled = false; return; }
    show('wait');
    unsubStaff = fb.F.onSnapshot(
      fb.F.doc(fb.db, 'staff', user.uid),
      (snap) => {
        const st = snap.exists() ? snap.data() : null;
        if (!st) return deny('직원 정보를 찾지 못했어요. 점장에게 문의해 주세요.');
        if (!st.active) return deny('사용이 중지된 계정이에요. 점장에게 문의해 주세요.');
        if (!C.ALLOWED_ROLES.includes(st.role)) return deny('이 계정으로는 들어갈 수 없어요. 점장에게 문의해 주세요.');
        renderHome(st);
      },
      () => deny('계정 정보를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.')
    );
  });

  $('#login-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const id = $('#uid').value.trim();
    const pw = $('#upw').value;
    if (!ID_RE.test(id)) return setMsg('아이디는 영문·숫자 3자 이상으로 입력해 주세요.');
    if (!pw) return setMsg('비밀번호를 입력해 주세요.');
    const btn = $('#login-btn');
    btn.disabled = true;
    setMsg('확인하고 있어요…', true);
    try {
      await fb.A.signInWithEmailAndPassword(fb.auth, id + '@' + C.LOGIN_DOMAIN, pw);
      $('#upw').value = '';
      setMsg('');
    } catch (e) {
      const code = e && e.code;
      btn.disabled = false;
      $('#upw').value = '';
      if (code === 'auth/too-many-requests') setMsg('시도가 너무 많았어요. 잠시 뒤에 다시 해 주세요.');
      else if (code === 'auth/network-request-failed') setMsg('네트워크가 불안정해요. 연결을 확인해 주세요.');
      else setMsg('아이디 또는 비밀번호를 다시 확인해 주세요.');
    }
  });

  $('#logout').addEventListener('click', () => deny(''));
}
