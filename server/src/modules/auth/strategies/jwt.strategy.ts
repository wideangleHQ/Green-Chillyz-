import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../interfaces';
import { SessionService } from '../services/session.service';
import { AUTH_ERRORS } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
  ) {
    const accessCookieName = configService.get<string>(
      'auth.accessTokenCookieName',
      'gc_access_token',
    );

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[accessCookieName] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('auth.jwtSecret'),
      issuer: configService.get<string>('auth.jwtIssuer', 'greenchillyz-api'),
      audience: configService.get<string>(
        'auth.jwtAudience',
        'greenchillyz-client',
      ),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const session = await this.sessionService.getSession(payload.sessionId);
    if (!session) {
      throw new UnauthorizedException(AUTH_ERRORS.SESSION_EXPIRED);
    }

    const currentTokenVersion = await this.sessionService.getTokenVersion(
      payload.sub,
    );
    if (payload.tokenVersion < currentTokenVersion) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_TOKEN);
    }

    return payload;
  }
}
