import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { FoodType, MenuStatus, SpiceLevel } from '@prisma/client';
import { PaginationDto } from '../../../common/dto';
import { MENU_DEFAULTS, MENU_SORT, SKU_PATTERN } from '../constants';

export class CreateMenuCategoryDto {
  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({
    description: 'Derived from the name when omitted; you rarely need this.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Absolute http(s) URL' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @IsOptional()
  @MaxLength(500)
  image?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Parent category' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional({ enum: MenuStatus, default: MenuStatus.DRAFT })
  @IsEnum(MenuStatus)
  @IsOptional()
  status?: MenuStatus;
}

export class UpdateMenuCategoryDto extends PartialType(
  OmitType(CreateMenuCategoryDto, ['slug'] as const),
) {}

export class CreateMenuItemDto {
  @ApiProperty({
    description: 'Immutable business key, e.g. GC-BIR-001. Generated when omitted.',
    pattern: SKU_PATTERN.source,
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  @Matches(SKU_PATTERN, { message: 'sku must look like GC-BIR-001' })
  sku?: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Derived from the name when omitted.' })
  @IsString()
  @IsOptional()
  @MaxLength(240)
  slug?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiProperty({ enum: FoodType })
  @IsEnum(FoodType)
  foodType!: FoodType;

  @ApiPropertyOptional({ enum: SpiceLevel })
  @IsEnum(SpiceLevel)
  @IsOptional()
  spiceLevel?: SpiceLevel;

  @ApiPropertyOptional({ description: 'Minutes', minimum: 0, maximum: 600 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(600)
  @IsOptional()
  preparationTime?: number;

  @ApiPropertyOptional({ maxLength: 100, example: 'Serves 2' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  servingSize?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  calories?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Grams' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  protein?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Grams' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  fat?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Grams' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  carbs?: number;

  @ApiProperty({ minimum: 0, description: 'Price in currency units' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Discounted price if applicable' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  discountedPrice?: number;

  @ApiPropertyOptional({ enum: MenuStatus, default: MenuStatus.DRAFT })
  @IsEnum(MenuStatus)
  @IsOptional()
  status?: MenuStatus;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isRecommended?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isSeasonal?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({
    type: [String],
    description: 'Extra search terms; name, category and tags are added automatically.',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  searchKeywords?: string[];

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tagIds?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}

/**
 * SKU is omitted deliberately: it is assigned once at creation and never
 * accepted by an update, so a dish keeps its identity for life.
 */
export class UpdateMenuItemDto extends PartialType(
  OmitType(CreateMenuItemDto, ['sku', 'slug', 'foodType'] as const),
) {
  @ApiPropertyOptional({ enum: FoodType })
  @IsEnum(FoodType)
  @IsOptional()
  foodType?: FoodType;
}

export class CreateMenuItemImageDto {
  @ApiProperty({ description: 'Absolute http(s) URL. Binary is never stored.' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(1000)
  url!: string;

  @ApiPropertyOptional({ description: 'Absolute http(s) URL' })
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @IsOptional()
  @MaxLength(1000)
  thumbnailUrl?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  altText?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}

export class CreateMenuTagDto {
  @ApiProperty({ maxLength: 80, example: 'Chef Special' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name!: string;

  @ApiPropertyOptional({ description: 'Derived from the name when omitted.' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  description?: string;

  @ApiPropertyOptional({ example: '#1B5E20' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'colorHex must be #RRGGBB' })
  colorHex?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;

  @ApiPropertyOptional({ default: 0 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ enum: MenuStatus, default: MenuStatus.ACTIVE })
  @IsEnum(MenuStatus)
  @IsOptional()
  status?: MenuStatus;
}

export class UpdateMenuTagDto extends PartialType(
  OmitType(CreateMenuTagDto, ['slug'] as const),
) {}

export class MenuItemQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Category slug' })
  @IsString()
  @IsOptional()
  @MaxLength(180)
  category?: string;

  @ApiPropertyOptional({ description: 'Tag slug' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  tag?: string;

  @ApiPropertyOptional({ enum: FoodType })
  @IsEnum(FoodType)
  @IsOptional()
  foodType?: FoodType;

  @ApiPropertyOptional({ enum: MenuStatus })
  @IsEnum(MenuStatus)
  @IsOptional()
  status?: MenuStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiPropertyOptional()
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  featuredOnly?: boolean;

  @ApiPropertyOptional({
    enum: Object.values(MENU_SORT),
    default: MENU_SORT.SORT_ORDER,
  })
  @IsEnum(MENU_SORT)
  @IsOptional()
  sort?: (typeof MENU_SORT)[keyof typeof MENU_SORT];
}

export class MenuSearchDto extends PaginationDto {
  @ApiProperty({ minLength: MENU_DEFAULTS.SEARCH_MIN_LENGTH })
  @IsString()
  @IsNotEmpty()
  @MinLength(MENU_DEFAULTS.SEARCH_MIN_LENGTH)
  @MaxLength(120)
  q!: string;

  @ApiPropertyOptional({ enum: FoodType })
  @IsEnum(FoodType)
  @IsOptional()
  foodType?: FoodType;

  @ApiPropertyOptional({ description: 'Category slug' })
  @IsString()
  @IsOptional()
  @MaxLength(180)
  category?: string;
}

export class AssignMenuTagsDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  tagIds!: string[];
}

/**
 * Runs the importer against a JSON document. Dry run is the only supported
 * mode in this phase; the flag exists so the contract does not change when
 * writing is enabled.
 */
export class MenuImportDto {
  @ApiPropertyOptional({
    description: 'Path to a JSON file on the server. Defaults to the bundled menu.json.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  filePath?: string;

  @ApiPropertyOptional({
    description: 'Inline JSON document. Takes precedence over filePath.',
  })
  @IsString()
  @IsOptional()
  rawJson?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Only true is accepted in this phase; writing awaits migration approval.',
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;
}
