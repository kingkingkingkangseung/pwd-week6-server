// CORS 설정 - 로컬 개발 및 배포 환경 대응
const getCorsConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // 허용할 클라이언트 URL들
  const allowedOrigins = new Set([
    'http://localhost:5173',    // 로컬 Vite
    'http://localhost:3000',    // CRA 예비용
    'http://127.0.0.1:5173',
    'https://pwd-week6-client-murex.vercel.app',
    'https://pwd-week6-client.vercel.app'
  ]);

  // ✅ 환경변수에서 추가 URL들 가져오기 (뒤에 / 있으면 제거)
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach(url => {
      allowedOrigins.add(url.replace(/\/$/, ''));
    });
  }

  // ✅ 프로덕션 환경일 때 배포용 주소 추가
  if (!isDevelopment) {
    if (process.env.VERCEL_URL) {
      allowedOrigins.add(`https://${process.env.VERCEL_URL}`.replace(/\/$/, ''));
    }
    if (process.env.PRODUCTION_CLIENT_URL) {
      allowedOrigins.add(process.env.PRODUCTION_CLIENT_URL.replace(/\/$/, ''));
    }
    const defaultClient = (process.env.DEFAULT_CLIENT_URL || 'https://pwd-week6-client.vercel.app').replace(/\/$/, '');
    allowedOrigins.add(defaultClient);
  }

  // ✅ 배열로 변환
  const originsArray = Array.from(allowedOrigins);

  console.log('🔧 CORS Config:', {
    isDevelopment,
    allowedOrigins: originsArray,
    clientUrl: process.env.CLIENT_URL
  });

  return {
    origin: (origin, callback) => {
      // Origin 헤더가 없는 요청(Postman, 서버간 통신 등)은 허용
      if (!origin) {
        console.log('✅ CORS: No origin header (server-to-server)');
        return callback(null, true);
      }

      console.log(`🔍 CORS: Checking origin: ${origin}`);
      
      if (originsArray.includes(origin)) {
        console.log('✅ CORS: Origin allowed');
        callback(null, true);
      } else {
        console.warn(`❌ CORS blocked origin: ${origin}`);
        console.log('Allowed origins:', originsArray);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200, // IE11 대응
  };
};

module.exports = getCorsConfig;