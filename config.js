/* 직원 포털 설정. Firebase 웹 설정값은 클라이언트 공개용이며 예약 콘솔(ops-desk-7k3)과 동일 프로젝트다.
   보호는 Firebase 보안 규칙과 각 앱 로그인이 담당한다(이 파일이 아님). */
window.PORTAL_CONFIG = {
  ALLOW_PREVIEW: true, // localhost·127.0.0.1·file:// 에서만 동작. 배포 주소에서는 이 값과 무관하게 무시된다.
  FIREBASE: {
    apiKey: 'AIzaSyBq8Bl5dxD2P_0PJhRfJ7w4mPLpJI8Wo8Q',
    authDomain: 'hotel-around-rsv.firebaseapp.com',
    projectId: 'hotel-around-rsv',
    appId: '1:937935595319:web:6f48d003c308b98f521cb2'
  },
  LOGIN_DOMAIN: 'staff.hotelaround.app',      // 로그인 ID → ID@도메인 (실제 메일 아님)
  ALLOWED_ROLES: ['admin', 'manager', 'staff'], // 'staff'는 호환용. 실존 역할은 admin·manager
  APPS: [
    { id: 'rsv', title: '채널 예약 콘솔', desc: 'OTA 예약 인입·확인', icon: 'rsv',
      roles: ['admin', 'manager', 'staff'], url: 'https://hotelaroundsokcho.github.io/ops-desk-7k3/' },
    { id: 'hk-admin', title: '정비 관리', desc: '객실 정비 현황·검수', icon: 'hk',
      roles: ['admin', 'manager', 'staff'], url: 'https://hotelaroundsokcho.github.io/housekeeping/' }
  ]
};
