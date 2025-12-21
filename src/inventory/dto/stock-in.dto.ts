import { IsInt, IsPositive, IsOptional, IsString } from 'class-validator';

export class StockInDto {
  @IsInt({ message: 'Product ID must be an integer' })
  @IsPositive({ message: 'Product ID must be positive' })
  productId: number;

  @IsInt({ message: 'Quantity must be an integer' })
  @IsPositive({ message: 'Quantity must be a positive number' })
  quantity: number;

  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;
}
