import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  private readonly counts = new Map<string, number>();

  markConnected(userId: string): boolean {
    const prev = this.counts.get(userId) ?? 0;
    const next = prev + 1;
    this.counts.set(userId, next);

    return prev === 0 && next === 1;
  }

  markDisconnected(userId: string): boolean {
    const prev = this.counts.get(userId) ?? 0;
    const next = Math.max(prev - 1, 0);

    if (next === 0) {
      this.counts.delete(userId);
    } else {
      this.counts.set(userId, next);
    }

    return prev === 1 && next === 0;
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.counts.keys());
  }

  isOnline(userId: string): boolean {
    return (this.counts.get(userId) ?? 0) > 0;
  }
}
