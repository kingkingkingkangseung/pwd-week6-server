// src/routes/auth.routes.js
const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth.middleware');

const router = express.Router();

// ✅ 회원가입 (로컬)
router.post('/register', isNotAuthenticated, authController.register);

// ✅ 로그인 (로컬)
router.post('/login', isNotAuthenticated, authController.login);

// ✅ 로그아웃 (세션 삭제 + 쿠키 제거)
router.post('/logout', async (req, res) => {
  try {
    if (!req.session) {
      return res.json({ success: true, message: 'No active session' });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('[Logout Error]', err);
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }

      // ✅ express-session의 기본 쿠키 이름: 'connect.sid'
      // ✅ 혹시 커스텀 이름을 썼다면 .env의 SESSION_NAME 참고
      const cookieName = process.env.SESSION_NAME || 'connect.sid';

      // ✅ HTTPS 환경에서 Render + Vercel 동작 보장
      res.clearCookie(cookieName, {
        path: '/',                 // ✅ 기본 경로 일치해야 삭제됨
        httpOnly: true,
        secure: true,              // ✅ HTTPS 필수
        sameSite: 'none',          // ✅ cross-site 허용
      });

      console.log(`[Logout] Session destroyed, cleared cookie: ${cookieName}`);
      return res.status(200).json({ success: true, message: 'Logged out successfully' });
    });
  } catch (e) {
    console.error('[Logout Exception]', e);
    return res.status(500).json({ success: false, message: 'Logout failed' });
  }
});

// ✅ 세션 인증 상태 확인
router.get('/me', authController.getCurrentUser);

// ✅ Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', authController.googleCallback);

// ✅ Naver OAuth
router.get(
  '/naver',
  passport.authenticate('naver', { auth_type: 'reprompt', prompt: 'login', display: 'page' })
);
router.get('/naver/callback', authController.naverCallback);

module.exports = router;
