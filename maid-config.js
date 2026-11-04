/* 메이드 입구 설정. 앱 주소는 여기에 없다 — 정비 코드가 맞을 때만 서버(Apps Script)가 응답으로 준다.
   CODE_VERIFY_URL 이 비어 있으면 입구는 닫힌 상태를 유지한다. */
window.MAID_CONFIG = {
  ALLOW_PREVIEW: true, // localhost·127.0.0.1·file:// 에서만 동작
  CODE_VERIFY_URL: '', // ← 정비 코드 서버 웹 앱 URL(https://script.google.com/macros/s/…/exec) 입력 필요
  SESSION_HOURS: 12,
  MAX_LOCAL_FAILS: 5,
  LOCK_SECONDS: 60,
  APPS: [
    { id: 'hk-maid', title: '정비앱', titleEn: 'Housekeeping', desc: '객실 정비 시작', descEn: 'Start room cleaning', icon: 'hk' },
    { id: 'attendance', title: '출근 입력', titleEn: 'Clock in', desc: '출근 기록하기', descEn: 'Record your arrival', icon: 'clock' }
  ]
};
