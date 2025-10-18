// src/middleware/auth.middleware.js

// 세션 기반 인증만 허용 (Passport 세션 사용)
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
};

// 로컬 계정 확인 (비밀번호 변경 등)
const isLocalAccount = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  }
  if (req.user?.provider !== 'local') {
    return res.status(403).json({ success: false, message: '로컬 계정만 사용 가능한 기능입니다.' });
  }
  return next();
};

// 비로그인 상태 확인 (회원가입/로그인 접근 허용)
// 이미 로그인 상태여도 차단하지 않음: 로그인/회원가입 요청을 idempotent하게 처리할 수 있도록 허용
const isNotAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    // 이미 로그인 상태면 다음 단계에서 컨트롤러가 적절히 처리하도록 통과
    return next();
  }
  return next();
};

// 관리자 권한 확인
const isAdmin = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: '로그인이 필요합니다.' });
  }
  if (req.user?.userType !== 'admin') {
    return res.status(403).json({ success: false, message: '관리자 권한이 필요합니다.' });
  }
  return next();
};

module.exports = { isAuthenticated, isLocalAccount, isNotAuthenticated, isAdmin };
