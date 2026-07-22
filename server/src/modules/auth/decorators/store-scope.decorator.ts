import { SetMetadata } from '@nestjs/common';
import { STORE_SCOPE_KEY } from '../../../common/constants';

export const StoreScope = () => SetMetadata(STORE_SCOPE_KEY, true);
