import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { join } from 'path';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { MenuImportService, MenuService } from '../services';
import { MenuImportDto } from '../dto';
import { MENU_PERMISSIONS } from '../constants';
import { CurrentUser } from '../../../common/decorators';

@ApiTags('Menu Import')
@Controller({ path: 'menu/import', version: '1' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MenuImportController {
  private readonly defaultSource = join(process.cwd(), 'src', 'menu.json');

  constructor(
    private readonly importService: MenuImportService,
    private readonly menuService: MenuService,
  ) {}

  @Post('dry-run')
  @Permissions(MENU_PERMISSIONS.IMPORT_RUN)
  @ApiOperation({
    summary: 'Validate a menu document without writing',
    description:
      'Runs the full pipeline — parse, normalize, resolve relationships, generate slugs and missing SKUs — and returns a report of what would be imported. Never touches the database.',
  })
  async dryRun(@Body() dto: MenuImportDto) {
    if (dto.rawJson) {
      return this.importService.analyzeJson(dto.rawJson);
    }
    return this.importService.analyzeFile(dto.filePath ?? this.defaultSource);
  }

  @Post('run')
  @Permissions(MENU_PERMISSIONS.IMPORT_RUN)
  @ApiOperation({
    summary: 'Import a menu document into the database',
    description:
      'Validates, normalizes and writes the menu to PostgreSQL in a single transaction. Creates placeholder images for items without images. Invalidates all Redis caches on success.',
  })
  async run(@Body() dto: MenuImportDto, @CurrentUser('id') userId?: string) {
    return this.menuService.runImport(
      { filePath: dto.filePath ?? this.defaultSource, rawJson: dto.rawJson },
      userId,
    );
  }
}
