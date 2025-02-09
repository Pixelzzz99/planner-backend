import { JwtModule } from '@nestjs/jwt';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ cors: true })
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  afterInit(server: Server) {
    console.log('webSocket Initialized');
  }

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new Error('Unauthorized');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      client.data.userId = decoded.sub;
      console.log(`Client connected: ${client.id}`);
    } catch (error) {
      console.log('Authentication error');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('updateTask')
  handleTaskUpdate(client: Socket, payload: any) {
    this.server.emit('taskUpdated', payload);
  }

  @SubscribeMessage('updateGoal')
  handleGoalUpdate(client: Socket, payload: any) {
    this.server.emit('goalUpdated', payload);
  }
}
