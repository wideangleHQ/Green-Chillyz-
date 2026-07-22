import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import {
  AuthService,
  TokenService,
  SessionService,
  SupabaseService,
  DeviceService,
  LoginHistoryService,
  OtpService,
} from './services';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermissionsGuard } from './guards/permissions.guard';
import { StoreScopeGuard } from './guards/store-scope.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: config.get('auth.jwtExpiresIn', '15m') as any,
          issuer: config.get<string>('auth.jwtIssuer', 'greenchillyz-api'),
          audience: config.get<string>(
            'auth.jwtAudience',
            'greenchillyz-client',
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    SessionService,
    SupabaseService,
    DeviceService,
    LoginHistoryService,
    OtpService,
    JwtStrategy,
    PermissionsGuard,
    StoreScopeGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    SessionService,
    DeviceService,
    PermissionsGuard,
    StoreScopeGuard,
  ],
})
export class AuthModule {}
