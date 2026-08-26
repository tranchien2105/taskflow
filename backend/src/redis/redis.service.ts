import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),

      retryStrategy: (times) => {
        if (times > 3) {
          this.logger.warn('Redis reconnect attempts exhausted');

          return null;
        }

        return Math.min(times * 200, 1000);
      },
    });

    this.redis.on('error', (error) => {
      this.logger.warn(`[Redis] Connection error: ${error.message}`);
    });
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch {
      this.logger.warn(`[Redis] GET failed for key: ${key}`);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redis.set(key, value, 'EX', ttl);
        return;
      }

      await this.redis.set(key, value);
    } catch {
      this.logger.warn(`[Redis] SET failed for key: ${key}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch {
      this.logger.warn(`[Redis] DELETE failed for key: ${key}`);
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';

      do {
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );

        cursor = nextCursor;

        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
    } catch {
      this.logger.warn(`[Redis] DELETE failed for pattern: ${pattern}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }
}
