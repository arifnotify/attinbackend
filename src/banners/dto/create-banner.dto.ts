import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateBannerDto {

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsOptional()
  @IsEnum([
    'none',
    'product',
    'flashSale',
    'category',
  ])
  linkType?: string;

  @IsOptional()
  @IsMongoId()
  linkId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
