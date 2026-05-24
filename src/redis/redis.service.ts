import { Injectable, OnModuleInit } from '@nestjs/common';

import { createClient } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private client;

  async onModuleInit() {
    this.client = createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
    });

    await this.client.connect();

    console.log('✅ Redis Connected');
  }

  async set(key: string, value: string, ttl: number) {
    await this.client.set(key, value, {
      EX: ttl,
    });
  }

  async get(key: string) {
    return this.client.get(key);
  }

  async delete(key: string) {
    return this.client.del(key);
  }
}
