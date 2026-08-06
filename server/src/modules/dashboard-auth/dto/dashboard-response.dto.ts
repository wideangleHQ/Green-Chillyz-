import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Swagger response shapes.
 *
 * Documentation only — the controller returns plain objects built by the
 * services, which the global ResponseInterceptor envelopes. These classes
 * exist so the dashboard frontend can generate a typed client.
 */

export class DashboardStoreScopeDto {
  @ApiProperty({ format: 'uuid' })
  storeId!: string;

  @ApiProperty({ format: 'uuid' })
  brandId!: string;

  @ApiProperty({ enum: ['STORE'], example: 'STORE' })
  scopeType!: 'STORE';
}

export class DashboardStoreContextDto {
  @ApiProperty({ format: 'uuid' })
  storeId!: string;

  @ApiProperty({ example: 'GreenChillyz Patia' })
  storeName!: string;

  @ApiProperty({ example: 'greenchillyz-patia' })
  storeSlug!: string;

  @ApiProperty({ example: 'PAT' })
  storeCode!: string;

  @ApiProperty({
    description: 'Brand the store trades under — its type within the group',
    example: 'greenchillyz',
  })
  storeType!: string;

  @ApiProperty({ format: 'uuid' })
  brandId!: string;

  @ApiProperty({ example: 'GreenChillyz' })
  brandName!: string;

  @ApiProperty({ example: 'greenchillyz' })
  brandSlug!: string;

  @ApiProperty({ example: 'Bhubaneswar' })
  city!: string;

  @ApiProperty({ example: 'Odisha' })
  state!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  dashboardAccessEnabled!: boolean;

  @ApiProperty({ type: DashboardStoreScopeDto })
  scope!: DashboardStoreScopeDto;

  @ApiProperty({ example: 'STORE_DASHBOARD' })
  role!: string;

  @ApiProperty({ example: 'STORE_DASHBOARD' })
  permissionsProfile!: string;

  @ApiProperty({
    type: [String],
    description:
      'Empty until the Permission Engine module binds a real resolver',
    example: [],
  })
  permissions!: string[];
}

export class DashboardLoginResponseDto {
  @ApiProperty({ type: DashboardStoreContextDto })
  store!: DashboardStoreContextDto;

  @ApiProperty({ format: 'uuid', description: 'Id of the session just created' })
  sessionId!: string;

  @ApiProperty({ example: 'Dashboard login successful' })
  message!: string;
}

export class DashboardMessageResponseDto {
  @ApiProperty({ example: 'Logged out successfully' })
  message!: string;
}

export class DashboardSessionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '203.0.113.42' })
  ipAddress!: string;

  @ApiPropertyOptional({ nullable: true })
  userAgent!: string | null;

  @ApiPropertyOptional({ nullable: true })
  deviceFingerprint!: string | null;

  @ApiProperty()
  issuedAt!: Date;

  @ApiProperty()
  lastActivityAt!: Date;

  @ApiProperty()
  expiresAt!: Date;

  @ApiProperty({ description: 'True for the session making this request' })
  isCurrent!: boolean;
}

export class DashboardCurrentSessionDto extends DashboardSessionDto {
  @ApiProperty({ format: 'uuid' })
  storeId!: string;
}
