import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import {
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

@SubscribeMessage('join_user')
handleJoinUser(
  @MessageBody() userId: string,
  @ConnectedSocket() client: Socket,
) {
  client.join(`user_${userId}`);

  console.log(
    `User Joined user_${userId}`,
  );
}

@SubscribeMessage('join_rider')
handleJoinRider(
  @MessageBody() riderId: string,
  @ConnectedSocket() client: Socket,
) {
  client.join(`rider_${riderId}`);

  console.log(
    `Rider Joined rider_${riderId}`,
  );
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },

  transports: ['websocket', 'polling'],
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
emitAddressUpdated(
  userId: string,
) {
  this.server
    .to(`user_${userId}`)
    .emit(
      'address_updated',
      {
        success: true,
      },
    );
}
  @WebSocketServer()
  server: Server;

  // ==========================
  // CONNECT
  // ==========================

  handleConnection(client: Socket) {
    console.log(`Socket Connected: ${client.id}`);
  }

  // ==========================
  // DISCONNECT
  // ==========================

  handleDisconnect(client: Socket) {
    console.log(`Socket Disconnected: ${client.id}`);
  }

  // ==========================
  // HOME UPDATE
  // ==========================

  emitHomeUpdated() {
    this.server.emit('home_updated', {
      success: true,
      message: 'Home data updated',
      time: new Date(),
    });
  }

  // ==========================
  // PRODUCT UPDATE
  // ==========================

  emitProductUpdated() {
    this.server.emit('product_updated', {
      success: true,
    });
  }

  // ==========================
  // BANNER UPDATE
  // ==========================

  emitBannerUpdated() {
    this.server.emit('banner_updated', {
      success: true,
    });
  }

  // ==========================
  // FLASH SALE UPDATE
  // ==========================

  emitFlashSaleUpdated() {
    this.server.emit('flash_sale_updated', {
      success: true,
    });
  }

  // ==========================
  // NEW ORDER
  // ==========================

  emitNewOrder(order: any) {
    this.server.emit('new_order', order);
  }

  // ==========================
  // ORDER UPDATED
  // ==========================
  
emitOrderUpdated(order: any) {

  if (!order) return;

  this.server.emit(
    "order_updated",
    order
  );

}

  // ==========================
  // ORDER DELETED
  // ==========================
  
  emitOrderDeleted(orderId: string) {
    this.server.emit(
      "order_deleted",
      {
        orderId,
      }
    );
  }

  // ==========================
  // ORDER STATUS
  // ==========================

  emitOrderStatusChanged(userId: string, order: any) {
    this.server.to(`user_${userId}`).emit('order_status_changed', order);
  }

  // ==========================
  // RIDER ASSIGN
  // ==========================

  emitOrderAssigned(riderId: string, order: any) {
    this.server.to(`rider_${riderId}`).emit('order_assigned', order);
  }
  
  ///////////////////////////////////////////////
  emitCartUpdated(){

  this.server.emit(
    "cartUpdated",
    {
      message:"Cart product updated"
    }
  );

}


}
