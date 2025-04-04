export default () => ({
  port: parseInt(process.env.CHAT_SERVICE_PORT || '4001', 10),
  database: {
    host: process.env.MONGO_HOST || 'localhost',
    port: parseInt(process.env.MONGO_PORT || '27017', 10),
    username: process.env.MONGO_INITDB_ROOT_USERNAME || 'admin',
    password: process.env.MONGO_INITDB_ROOT_PASSWORD,
    name: process.env.MONGO_DB_NAME || 'chatti',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  queue: {
    translation: 'translation',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
}); 