import { Injectable } from '@nestjs/common';

@Injectable()
export class CodProvider {
  async createPayment() {
    return {

     paymentMethod:'COD',

     paymentStatus:'PENDING',

     paymentUrl:null,

   };

 }

}