import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  transports: ['websocket', 'polling'],
})
export class SocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  // ==========================
  // CONNECT
  // ==========================

  handleConnection(client: Socket) {
    console.log(
      `🟢 Socket Connected: ${client.id}`,
    );
  }

  // ==========================
  // DISCONNECT
  // ==========================

  handleDisconnect(client: Socket) {
    console.log(
      `🔴 Socket Disconnected: ${client.id}`,
    );
  }

  // ==========================
  // USER JOIN ROOM
  // ==========================

  @SubscribeMessage('join_user')
  handleJoinUser(
    @MessageBody() userId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`user_${userId}`);

    console.log(
      `👤 User Joined Room: user_${userId}`,
    );
  }

  // ==========================
  // RIDER JOIN ROOM
  // ==========================

  @SubscribeMessage('join_rider')
  handleJoinRider(
    @MessageBody() riderId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`rider_${riderId}`);

    console.log(
      `🚚 Rider Joined Room: rider_${riderId}`,
    );
  }

  // ==========================
  // ADDRESS UPDATED
  // ==========================

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

  // ==========================
  // HOME UPDATE
  // ==========================

  emitHomeUpdated() {
    this.server.emit(
      'home_updated',
      {
        success: true,
        message:
          'Home data updated',
        time: new Date(),
      },
    );
  }

  // ==========================
  // PRODUCT UPDATE
  // ==========================

  emitProductUpdated() {
    this.server.emit(
      'product_updated',
      {
        success: true,
      },
    );
  }

  // ==========================
  // BANNER UPDATE
  // ==========================

  emitBannerUpdated() {
    this.server.emit(
      'banner_updated',
      {
        success: true,
      },
    );
  }

  // ==========================
  // FLASH SALE UPDATE
  // ==========================

  emitFlashSaleUpdated() {
    this.server.emit(
      'flash_sale_updated',
      {
        success: true,
      },
    );
  }

  // ==========================
  // NEW ORDER
  // ==========================

  emitNewOrder(
    order: any,
  ) {
    this.server.emit(
      'new_order',
      order,
    );
  }

  // ==========================
  // ORDER UPDATED
  // ==========================

  emitOrderUpdated(
    order: any,
  ) {
    if (!order) return;

    this.server.emit(
      'order_updated',
      order,
    );
  }

  // ==========================
  // ORDER DELETED
  // ==========================

  emitOrderDeleted(
    orderId: string,
  ) {
    this.server.emit(
      'order_deleted',
      {
        orderId,
      },
    );
  }

  // ==========================
  // ORDER STATUS CHANGED
  // ==========================

  emitOrderStatusChanged(
    userId: string,
    order: any,
  ) {
    this.server
      .to(`user_${userId}`)
      .emit(
        'order_status_changed',
        order,
      );
  }

  // ==========================
  // ORDER ASSIGNED
  // ==========================

  emitOrderAssigned(
    riderId: string,
    order: any,
  ) {
    this.server
      .to(`rider_${riderId}`)
      .emit(
        'order_assigned',
        order,
      );
  }

  // ==========================
  // CART UPDATED
  // ==========================

  emitCartUpdated() {
    this.server.emit(
      'cart_updated',
      {
        success: true,
        message:
          'Cart product updated',
      },
    );
  }

  // ==========================
// LOCATION UPDATED
// ==========================

emitLocationUpdated() {
  this.server.emit('location_updated', {
    success: true,
    message: 'Location updated',
    time: new Date(),
  });
}

// ==========================
  // USER UPDATED / PROFILE CHANGE
  // ==========================
  emitUserUpdated(userId: string, data?: any) {
    this.server.to(`user_${userId}`).emit('user_updated', {
      success: true,
      message: 'User profile updated',
      data,
    });
  }

  // ==========================
  // USER BLOCKED STATUS CHANGED
  // ==========================
  emitUserBlockStatusChanged(userId: string, isBlocked: boolean, reason?: string) {
    this.server.to(`user_${userId}`).emit('user_block_status', {
      isBlocked,
      reason,
    });
  }
}
