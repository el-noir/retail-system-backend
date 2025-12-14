import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsNumber, ValidateNested, IsPositive, Min } from 'class-validator';

export class CreateSaleItemDto {
  @IsNumber()
  productId: number;

  @IsNumber()
  @IsPositive()
  quantity: number;
}

export class CreateSaleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleItemDto)
  items: CreateSaleItemDto[];

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxAmount?: number = 0;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number = 0;

  @IsEnum(['cash', 'card'])
  paymentMethod: string;
}
