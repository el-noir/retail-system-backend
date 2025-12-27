import { IsNumber, IsInt, Min } from 'class-validator';

export class ReceiveItemDto {
  @IsNumber()
  @IsInt()
  productId: number;

  @IsNumber()
  @IsInt()
  @Min(1)
  receivedQty: number;
}

export class ReceiveGoodsDto {
  @IsNumber()
  @IsInt()
  @Min(1)
  receivedQty: number;
}
