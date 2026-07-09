import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';


class ItemDto {


@IsString()
  product: string;


@IsNumber()
quantity:number;


@IsNumber()
price:number;


@IsOptional()
@IsString()
productName?:string;


@IsOptional()
@IsString()
productImage?:string;
}


export class AdminEditOrderDto {
@IsArray()
@ValidateNested({each:true})
@Type(()=>ItemDto)
items:ItemDto[];

}