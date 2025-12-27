import { IsBoolean, IsNumber, IsInt, IsOptional, IsString, IsUUID, Min, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSupplierProductDto {
  @IsUUID()
  supplierId: string;

  @IsInt()
  @Type(() => Number)
  productId: number;

  @IsOptional()
  @IsString()
  supplierSku?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  supplierPrice: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stockQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minOrderQty?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  leadTimeDays?: number;

  @IsOptional()
  @IsBoolean()
  isPrimarySupplier?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSupplierProductDto {
  @IsOptional()
  @IsString()
  supplierSku?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  supplierPrice?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  stockQuantity?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minOrderQty?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  leadTimeDays?: number;

  @IsOptional()
  @IsBoolean()
  isPrimarySupplier?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAddProductsDto {
  @IsUUID()
  supplierId: string;

  @IsInt({ each: true })
  @Type(() => Number)
  productIds: number[];

  @IsDecimal()
  @Type(() => Number)
  defaultPrice: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  minOrderQty?: number;
}
