const config = {
  port: Number(process.env.PORT || 3000),

  redisHost: process.env.REDIS_HOST || "redis",

  redisPort: Number(
    process.env.REDIS_PORT || 6379
  ),

  redisPassword:
    process.env.REDIS_PASSWORD || undefined
};

export default config;