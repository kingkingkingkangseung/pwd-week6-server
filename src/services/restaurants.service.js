// src/services/restaurants.service.js
const path = require('path');
const { readFileSync } = require('fs');
const Restaurant = require('../models/restaurant.model');

const DATA_PATH = path.join(process.cwd(), 'src', 'data', 'restaurants.json');

/**
 * JSON 파일 읽기
 */
function readSeedDataSync() {
  try {
    const raw = readFileSync(DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('❌ Failed to read seed file:', err.message);
    return [];
  }
}

// Synchronous read for tests or non-DB usage
function getAllRestaurantsSync() {
  const data = readSeedDataSync();
  // deep clone to avoid accidental mutation in tests
  return JSON.parse(JSON.stringify(data));
}

/**
 * 필수 필드를 자동 보정하여 ValidationError 방지
 */
function normalizeSeedData(seedArray) {
  const seed = Array.isArray(seedArray) ? seedArray : [];
  let maxId = 0;

  for (const item of seed) {
    const n = Number(item?.id);
    if (Number.isFinite(n)) maxId = Math.max(maxId, n);
  }

  return seed.map((item, idx) => {
    const ensured = { ...item };
    // 필수 필드 기본값 보정
    ensured.id = Number.isFinite(Number(ensured.id)) ? Number(ensured.id) : ++maxId;
    ensured.name = ensured.name ?? `식당 ${idx + 1}`;
    ensured.category = ensured.category ?? '기타';
    ensured.location = ensured.location ?? '미정';

    // 선택 필드 기본값 보정
    ensured.priceRange = ensured.priceRange ?? '정보 없음';
    ensured.rating = Number.isFinite(Number(ensured.rating)) ? Number(ensured.rating) : 0;
    ensured.description = ensured.description ?? '';
    ensured.recommendedMenu = Array.isArray(ensured.recommendedMenu)
      ? ensured.recommendedMenu
      : [];
    ensured.likes = Number.isFinite(Number(ensured.likes)) ? Number(ensured.likes) : 0;
    ensured.image = ensured.image ?? '';

    return ensured;
  });
}

/**
 * 다음 식당 ID 자동 계산
 */
async function getNextRestaurantId() {
  const max = await Restaurant.findOne().sort('-id').select('id').lean();
  return (max?.id || 0) + 1;
}

/**
 * DB에서 모든 식당 가져오기
 */
async function getAllRestaurants() {
  const docs = await Restaurant.find({}).lean();
  return docs;
}

/**
 * ID로 단일 식당 가져오기
 */
async function getRestaurantById(id) {
  const numericId = Number(id);
  const doc = await Restaurant.findOne({ id: numericId }).lean();
  return doc || null;
}

/**
 * 인기 식당 (평점순)
 */
async function getPopularRestaurants(limit = 5) {
  const docs = await Restaurant.find({})
    .sort({ rating: -1 })
    .limit(limit)
    .lean();
  return docs;
}

/**
 * 새 식당 추가
 */
async function createRestaurant(payload) {
  const requiredFields = ['name', 'category', 'location'];
  const missingField = requiredFields.find((f) => !payload[f]);
  if (missingField) {
    const error = new Error(`'${missingField}' is required`);
    error.statusCode = 400;
    throw error;
  }

  const nextId = await getNextRestaurantId();

  const doc = await Restaurant.create({
    id: nextId,
    name: payload.name,
    category: payload.category,
    location: payload.location,
    priceRange: payload.priceRange ?? '정보 없음',
    rating: payload.rating ?? 0,
    description: payload.description ?? '',
    recommendedMenu: Array.isArray(payload.recommendedMenu)
      ? payload.recommendedMenu
      : [],
    likes: 0,
    image: payload.image ?? '',
  });

  return doc.toObject();
}

/**
 * DB 리셋 + 시드 데이터 재적재
 */
async function resetStore() {
  const seedRaw = readSeedDataSync();
  const seed = normalizeSeedData(seedRaw);
  await Restaurant.deleteMany({});
  await Restaurant.insertMany(seed);
  console.log(`✅ Restaurant store reset with ${seed.length} entries`);
}

/**
 * 서버 시작 시 최초 1회만 시드 데이터 주입
 */
async function ensureSeededOnce() {
  try {
    const count = await Restaurant.estimatedDocumentCount();
    if (count > 0) {
      console.log(`ℹ️ Restaurant already seeded (${count} items)`);
      return { seeded: false, count };
    }

    const seedRaw = readSeedDataSync();
    const seed = normalizeSeedData(seedRaw);

    if (!seed.length) {
      console.warn('⚠️ No seed data found in restaurants.json');
      return { seeded: false, count: 0 };
    }

    await Restaurant.insertMany(seed);
    console.log(`✅ Restaurant seed data inserted successfully (${seed.length} items)`);
    return { seeded: true, count: seed.length };
  } catch (err) {
    console.error('❌ Failed to seed restaurants:', err.message);
    throw err;
  }
}

/**
 * 식당 업데이트
 */
async function updateRestaurant(id, payload) {
  const numericId = Number(id);
  const updated = await Restaurant.findOneAndUpdate(
    { id: numericId },
    {
      $set: {
        name: payload.name,
        category: payload.category,
        location: payload.location,
        priceRange: payload.priceRange,
        rating: payload.rating,
        description: payload.description,
        recommendedMenu: Array.isArray(payload.recommendedMenu)
          ? payload.recommendedMenu
          : undefined,
        image: payload.image,
      },
    },
    { new: true, runValidators: true, lean: true }
  );
  return updated;
}

/**
 * 식당 삭제
 */
async function deleteRestaurant(id) {
  const numericId = Number(id);
  const deleted = await Restaurant.findOneAndDelete({ id: numericId }).lean();
  return deleted;
}

module.exports = {
  getAllRestaurants,
  getAllRestaurantsSync,
  getRestaurantById,
  getPopularRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  resetStore,
  ensureSeededOnce,
};
