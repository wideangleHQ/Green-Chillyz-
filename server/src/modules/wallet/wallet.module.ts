import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletController } from './wallet.controller';
import { WalletService, WalletCacheService } from './services';

@Module({
  imports: [AuthModule],
  controllers: [WalletController],
  providers: [WalletService, WalletCacheService],
  exports: [WalletService, WalletCacheService],
})
export class WalletModule {}
