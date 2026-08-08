import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCountryDto {

  @IsNotEmpty()
  @IsString()
  name: string;


  @IsNotEmpty()
  @IsString()
  code: string;


  @IsNotEmpty()
  @IsString()
  flag: string;
}
