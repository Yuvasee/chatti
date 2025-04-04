export default () => ({
  port: parseInt(process.env.AUTH_SERVICE_PORT || '4000', 10),
  database: {
    host: process.env.MONGO_HOST || 'localhost',
    port: parseInt(process.env.MONGO_PORT || '27017', 10),
    username: process.env.MONGO_INITDB_ROOT_USERNAME || 'admin',
    password: process.env.MONGO_INITDB_ROOT_PASSWORD,
    name: process.env.MONGO_DB_NAME || 'chatti',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key-for-development',
    expiresIn: '7d',
  },
}); 