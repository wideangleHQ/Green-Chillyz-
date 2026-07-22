import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly configService: ConfigService) {}

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: {
          host: this.configService.get<string>('queue.host'),
          port: this.configService.get<number>('queue.port'),
          password: this.configService.get<string>('queue.password') || undefined,
        },
      });
      this.queues.set(name, queue);
      this.logger.log(`Queue "${name}" initialized`);
    }
    return this.queues.get(name)!;
  }

  async addJob<T>(
    queueName: string,
    jobName: string,
    data: T,
    opts?: { delay?: number; priority?: number; attempts?: number },
  ): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.add(jobName, data, {
      delay: opts?.delay,
      priority: opts?.priority,
      attempts: opts?.attempts ?? 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    });
  }
}
