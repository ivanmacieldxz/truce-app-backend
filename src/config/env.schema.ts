import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_SECRET_KEY: Joi.string().required(),
  GOOGLE_APPLICATION_CREDENTIALS: Joi.string().optional(),
});
