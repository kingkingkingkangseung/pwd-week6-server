module.exports = function getCorsConfig() {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://pwd-week6-client-murex.vercel.app',
    'https://pwd-week6-client-git-main-kingkangseungs-projects.vercel.app',
    'https://pwd-week6-client-mzeh8cwcs-kingkangseungs-projects.vercel.app',
  ];

  return {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error(`CORS blocked for origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // 세션 쿠키 전달 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
};
