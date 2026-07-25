import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { StoreManagerService } from './services/store-manager.service';
import {
  CreateStoreManagerDto,
  UpdateStoreManagerDto,
  CreateStoreFacilityDto,
  CreateStoreAnnouncementDto,
  UpdateStoreAnnouncementDto,
} from './dto';
import { STORE_PERMISSIONS } from './constants';

@ApiTags('Store Managers')
@Controller({ path: 'stores/:storeId/managers', version: '1' })
export class StoreManagerController {
  constructor(private readonly managerService: StoreManagerService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.ASSIGN_MANAGER)
  @ApiOperation({ summary: 'Assign a manager to a store' })
  async assign(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: CreateStoreManagerDto,
  ) {
    return this.managerService.assignManager(storeId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.VIEW)
  @ApiOperation({ summary: 'List store managers' })
  async list(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.managerService.getManagers(storeId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.ASSIGN_MANAGER)
  @ApiOperation({ summary: 'Update manager role' })
  async update(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreManagerDto,
  ) {
    return this.managerService.updateManager(storeId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.ASSIGN_MANAGER)
  @ApiOperation({ summary: 'Remove a manager from a store' })
  async remove(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.managerService.removeManager(storeId, id);
    return { message: 'Manager removed successfully' };
  }
}

@ApiTags('Store Facilities')
@Controller({ path: 'stores/:storeId/facilities', version: '1' })
export class StoreFacilityController {
  constructor(private readonly managerService: StoreManagerService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Add a facility to a store' })
  async add(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: CreateStoreFacilityDto,
  ) {
    return this.managerService.addFacility(storeId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List store facilities' })
  async list(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.managerService.getFacilities(storeId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Remove a facility from a store' })
  async remove(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.managerService.removeFacility(storeId, id);
    return { message: 'Facility removed successfully' };
  }
}

@ApiTags('Store Announcements')
@Controller({ path: 'stores/:storeId/announcements', version: '1' })
export class StoreAnnouncementController {
  constructor(private readonly managerService: StoreManagerService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Create a store announcement' })
  async create(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Body() dto: CreateStoreAnnouncementDto,
  ) {
    return this.managerService.createAnnouncement(storeId, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all store announcements' })
  async list(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.managerService.getAnnouncements(storeId);
  }

  @Public()
  @Get('active')
  @ApiOperation({ summary: 'List active store announcements' })
  async listActive(@Param('storeId', ParseUUIDPipe) storeId: string) {
    return this.managerService.getActiveAnnouncements(storeId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Update an announcement' })
  async update(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStoreAnnouncementDto,
  ) {
    return this.managerService.updateAnnouncement(storeId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(STORE_PERMISSIONS.UPDATE)
  @ApiOperation({ summary: 'Delete an announcement' })
  async remove(
    @Param('storeId', ParseUUIDPipe) storeId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.managerService.deleteAnnouncement(storeId, id);
    return { message: 'Announcement deleted successfully' };
  }
}
