export const configuration = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    secretKey: process.env.SUPABASE_SECRET_KEY,
  },
  firebase: {
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
});
