export default () => ({
  port: parseInt(process.env.PORT, 10),
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT, 10),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  restaurantsApi: {
    key: process.env.RESTAURANTS_API_KEY,
    url: process.env.RESTAURANTS_API_URL,
  },
  cityApi: {
    key: process.env.CITY_API_KEY,
    url: process.env.CITY_API_URL,
  },
});
