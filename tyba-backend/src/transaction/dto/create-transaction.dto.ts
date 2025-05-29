import { IsString, IsOptional } from 'class-validator';

export class CreateTransactionDto {
  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  coordinates?: string;
}
