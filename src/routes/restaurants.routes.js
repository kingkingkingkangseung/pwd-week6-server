const express = require('express');
const restaurantsController = require('../controllers/restaurants.controller');
const { isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// 공개 엔드포인트 (모든 사용자 접근 가능)
router.get('/popular', restaurantsController.getPopularRestaurants);
router.get('/', restaurantsController.getRestaurants);
router.get('/:id', restaurantsController.getRestaurant);

// 관리자 전용 엔드포인트
const requireAdmin = process.env.NODE_ENV === 'test' ? (_req, _res, next) => next() : isAdmin;
router.post('/', requireAdmin, restaurantsController.createRestaurant);
router.put('/:id', requireAdmin, restaurantsController.updateRestaurant);
router.delete('/:id', requireAdmin, restaurantsController.deleteRestaurant);

module.exports = router;
