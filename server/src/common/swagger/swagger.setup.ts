import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication, apiPrefix: string): void {
  const config = new DocumentBuilder()
    .setTitle('GreenChillyz API')
    .setDescription(
      'Enterprise backend API for GreenChillyz — powering outlets, loyalty, wallet, CMS, and more.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'access-token',
    )
    // The dashboard authenticates purely by HttpOnly cookie — it never sends
    // a bearer token — so Swagger documents it as its own scheme.
    .addCookieAuth(
      'gc_dashboard_access_token',
      {
        type: 'apiKey',
        in: 'cookie',
        name: 'gc_dashboard_access_token',
        description:
          'Dashboard access token. Issued by POST /api/v1/dashboard/auth/login ' +
          'and rotated by POST /api/v1/dashboard/auth/refresh.',
      },
      'gc_dashboard_access_token',
    )
    .addTag('Health', 'Application health checks')
    .addTag(
      'Dashboard Authentication',
      'Store access code authentication for dashboard.greenchillyz.com',
    )
    .addTag('Dashboard Customers', 'Store-scoped customer operations')
    .addTag('Dashboard Wallets', 'Store-scoped wallet views and ledgers')
    .addTag('Dashboard Rewards', 'Reward catalog and redemption activity')
    .addTag('Dashboard Vouchers', 'Voucher lookup, redemption and history')
    .addTag('Dashboard Store', 'Store profile, statistics and activity')
    .addTag('Dashboard Notifications', 'Customer notification stream')
    .addTag('Dashboard Analytics', 'Operational analytics for the store')
    .addTag('Menu Categories', 'Master menu category management')
    .addTag('Menu Items', 'Master menu item CRUD, search and featured')
    .addTag('Menu Tags', 'Menu tag management')
    .addTag('Menu Import', 'Menu data import pipeline')
    .addTag('Reward Profiles', 'Reward profile management and versioning')
    .addTag('Reward Rules', 'Reward rules engine — milestones, rewards and configuration')
    .addTag('Reward Assignments', 'Assign reward profiles to stores — one active profile per store')
    .addTag('Reward Overrides', 'Store-level reward rule overrides and reward resolution preview')
    .addTag('Dashboard Reward Profiles', 'Dashboard: reward profile management, publishing, versioning')
    .addTag('Dashboard Reward Rules', 'Dashboard: reward rule CRUD, bulk operations, milestones')
    .addTag('Dashboard Reward Assignments', 'Dashboard: assign/change reward profiles for stores')
    .addTag('Dashboard Reward Overrides', 'Dashboard: store-level override management and preview')
    .addTag('Dashboard Reward Analytics', 'Dashboard: reward management analytics')
    .addTag('Dashboard Reward Search', 'Dashboard: cross-entity reward search')
    .addTag('Reward Resolution', 'Central reward resolution engine — the ONLY runtime decision point for rewards')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });
}
