import { IsOptional, IsString } from 'class-validator';

export class UpdateSupportLinkDto {
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  facebook?: string;

  @IsOptional()
  @IsString()
  instagram?: string;

  @IsOptional()
  @IsString()
  messenger?: string;
}