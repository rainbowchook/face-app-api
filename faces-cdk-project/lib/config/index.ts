export const config = {
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: Number(process.env.DB_PORT),
  DB_USER: process.env.DB_USER,
  DB_NAME: process.env.DB_NAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_SSL: process.env.DB_SSL,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  PORT: process.env.PORT,
  CLARIFAI_API_KEY: process.env.CLARIFAI_API_KEY,
  CLARIFAI_PAT_KEY: process.env.CLARIFAI_PAT_KEY,
  CLARIFAI_USER_ID: process.env.CLARIFAI_USER_ID,
  CLARIFAI_APP_ID: process.env.CLARIFAI_APP_ID,
}