export type RegistrationProvider = 'credentials' | 'google';

export class UserRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly provider: RegistrationProvider,
    public readonly occurredAt: Date = new Date(),
    public readonly ipAddress?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}
