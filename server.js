'use strict';
require('dotenv').config();
const cors = require('cors'); // ✅ CORS 추가
const { connectDB, closeDB } = require('./src/config/db');
const createApp = require('./src/app');
const { ensureSeededOnce } = require('./src/services/restaurants.service');

const PORT = process.env.PORT || 3000;

// ✅ Express 앱 생성
const app = createApp();

// ✅ CORS 설정 추가 (Render + Vercel 호환)
app.use(
  cors({
    origin: [
      'https://pwd-week6-client-murex.vercel.app', // ✅ Vercel 프론트엔드 주소
      'http://localhost:5173',                     // ✅ 로컬 개발용 (optional)
    ],
    credentials: true, // ✅ 세션/쿠키 기반 요청 허용
  })
);

async function start() {
  try {
    // ✅ DB 연결
    await connectDB(process.env.MONGODB_URI, process.env.DB_NAME);

    // ✅ 초기 데이터 시드
    await ensureSeededOnce();

    // ✅ 서버 실행
    if (require.main === module) {
      app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
    }
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();

// ✅ Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down...');
  await closeDB();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down...');
  await closeDB();
  process.exit(0);
});

module.exports = app;
