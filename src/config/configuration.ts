export const configuration = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
  },
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY,
  },
});
