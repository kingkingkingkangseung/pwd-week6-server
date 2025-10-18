// src/controllers/auth.controller.js
const passport = require('passport');
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');

class AuthController {
  /**
   * ????????
   * POST /api/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const email = (req.body?.email || '').toLowerCase().trim();
    const password = (req.body?.password || '').toString();
    const name = (req.body?.name || req.body?.fullName || req.body?.username || req.body?.displayName || '').toString().trim();

    // ?????????
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '?????? ???????, ?????? ??????????',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '???????????? 6??????????????????',
      });
    }

    const user = await authService.register({ email, password, name });

    // ?????????????? ??????
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '??????????????.',
        });
      }

      res.status(201).json({
        success: true,
        message: '?????????? ??????????????',
        data: { user },
      });
    });
  });

  /**
   * ???? ??????
   * POST /api/auth/login
   */
  login = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '??????????????.',
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: info.message || '???????? ????????????.',
        });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: '??????????????.',
          });
        }

        return res.json({
          success: true,
          message: '??????????????.',
          data: { user },
        });
      });
    })(req, res, next);
  };

  /**
   * ????????
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    // 로그인 여부와 상관 없이 세션 쿠키 제거 + 세션 파기
    try {
      if (req.isAuthenticated && req.isAuthenticated()) {
        await new Promise((resolve, reject) => req.logout(err => err ? reject(err) : resolve()));
      }
    } catch {} 
    try {
      await new Promise((resolve) => req.session?.destroy(() => resolve()));
    } catch {} 
    res.clearCookie(process.env.SESSION_NAME || 'sessionId');
    return res.json({ success: true, message: 'logged out' });
  });

  /**
   * ???? ?????????? ???
   * GET /api/auth/me
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('Vary', 'Cookie');
    if (!req.user) {
      return res.json({ success: true, status: 'ok', authenticated: false, isAuthenticated: false, user: null, data: null });
    }
    const user = await authService.getCurrentUser(req.user._id);
    return res.json({ success: true, status: 'ok', authenticated: true, isAuthenticated: true, user, data: { user } });
  });

  /**
   * ???? OAuth ???
   * GET /api/auth/google/callback
   */
  googleCallback = (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=server_error`);
      }

      if (!user) {
        return res.redirect(
          `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(
            info.message || '??????????'
          )}`
        );
      }

      req.login(user, (err) => {
        if (err) {
          return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=login_error`);
        }

        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`);
      });
    })(req, res, next);
  };

  /**
   * ??????OAuth ???
   * GET /api/auth/naver/callback
   */
  naverCallback = (req, res, next) => {
    passport.authenticate('naver', (err, user, info) => {
      console.log('[Naver Callback] Error:', err);
      console.log('[Naver Callback] User:', user);
      console.log('[Naver Callback] Info:', info);
      
      if (err) {
        console.error('[Naver Callback] Authentication error:', err);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=server_error`);
      }

      if (!user) {
        console.error('[Naver Callback] No user found:', info);
        return res.redirect(
          `${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=${encodeURIComponent(
            info.message || '??????????'
          )}`
        );
      }

      req.login(user, (err) => {
        if (err) {
          console.error('[Naver Callback] Login error:', err);
          return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=login_error`);
        }

        console.log('[Naver Callback] Successfully logged in user:', user._id);
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard`);
      });
    })(req, res, next);
  };

}

module.exports = new AuthController();




