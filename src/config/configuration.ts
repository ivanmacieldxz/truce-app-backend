export const configuration = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  supabase: {
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
  },
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY,
  },
});
