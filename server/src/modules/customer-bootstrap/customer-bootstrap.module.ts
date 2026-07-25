import { Module } from '@nestjs/common';
import { WalletModule } from '../wallet/wallet.module';
import { CustomerBootstrapService } from './services';
import { UserRegisteredListener } from './listeners';
import { WalletInitializer, CustomerProfileInitializer } from './initializers';
import { BOOTSTRAP_INITIALIZERS } from './constants';
import { CustomerBootstrapInitializer } from './interfaces';

/**
 * Wires the customer provisioning pipeline.
 *
 * To add a new bootstrap resource: implement CustomerBootstrapInitializer,
 * provide the class here (or call CustomerBootstrapService.registerInitializer
 * from the owning module), and it joins the pipeline automatically. AuthService
 * is never touched.
 */
@Module({
  imports: [WalletModule],
  providers: [
    WalletInitializer,
    CustomerProfileInitializer,
    {
      provide: BOOTSTRAP_INITIALIZERS,
      inject: [WalletInitializer, CustomerProfileInitializer],
      useFactory: (
        ...initializers: CustomerBootstrapInitializer[]
      ): CustomerBootstrapInitializer[] => initializers,
    },
    CustomerBootstrapService,
    UserRegisteredListener,
  ],
  exports: [CustomerBootstrapService],
})
export class CustomerBootstrapModule {}
