import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SupabaseJwtPayload, SupabaseUser } from '../interfaces';
import { AUTH_ERRORS } from '../constants';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly supabaseJwtSecret: string;
  private readonly supabaseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.supabaseJwtSecret = this.configService.getOrThrow<string>(
      'auth.supabaseJwtSecret',
    );
    this.supabaseUrl = this.configService.getOrThrow<string>(
      'auth.supabaseUrl',
    );
  }

  async verifySupabaseToken(token: string): Promise<SupabaseUser> {
    try {
      const payload = this.jwtService.verify<SupabaseJwtPayload>(token, {
        secret: this.supabaseJwtSecret,
      });

      return {
        id: payload.sub,
        email: payload.email,
        user_metadata: payload.user_metadata,
        app_metadata: payload.app_metadata,
      };
    } catch (error) {
      this.logger.warn(`Supabase token verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException(AUTH_ERRORS.SUPABASE_AUTH_FAILED);
    }
  }

  async getSupabaseUser(accessToken: string): Promise<SupabaseUser> {
    const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: this.supabaseJwtSecret,
      },
    });

    if (!response.ok) {
      this.logger.warn(`Supabase user fetch failed with status ${response.status}`);
      throw new UnauthorizedException(AUTH_ERRORS.SUPABASE_AUTH_FAILED);
    }

    const data = (await response.json()) as SupabaseUser;
    return data;
  }
}
