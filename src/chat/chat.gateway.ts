import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service.js';
import { MessagesService } from './message.service.js';
import { BlockedUsersService } from '../users/blocked-users.service.js';

@WebSocketGateway({
  cors: { origin: 'http://localhost:4200' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
    private readonly blockedUsersService: BlockedUsersService, // шинэ
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        client.disconnect();
        return;
      }

      client.data.user = { id: user.id, name: user.name, email: user.email };

      if (!this.onlineUsers.has(user.id)) {
        this.onlineUsers.set(user.id, new Set());
      }
      this.onlineUsers.get(user.id)!.add(client.id);

      const recentMessages = await this.messagesService.findRecent(50);
      client.emit('history', recentMessages);

      const privateHistory = await this.messagesService.findPrivateHistory(
        user.id,
      );
      client.emit('private_history', privateHistory);

      client.emit('online_users', Array.from(this.onlineUsers.keys()));

      client.broadcast.emit('presence', { userId: user.id, online: true });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;

    const sockets = this.onlineUsers.get(user.id);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.onlineUsers.delete(user.id);
        client.broadcast.emit('presence', { userId: user.id, online: false });
      }
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sender = client.data.user;
    if (!sender) return;

    const message = await this.messagesService.create({
      text: data.text,
      senderId: sender.id,
      senderName: sender.name || sender.email,
    });

    this.server.emit('message', message);
  }

  @SubscribeMessage('private_message')
  async handlePrivateMessage(
    @MessageBody() data: { toUserId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sender = client.data.user;
    if (!sender) return;

    // шинэ: блоклогдсон бол мессеж vvсгэхгvй, хvлээн авагчид ч хvргэхгvй
    const blocked = await this.blockedUsersService.isBlocked(
      sender.id,
      data.toUserId,
    );
    if (blocked) {
      client.emit('private_message_error', {
        toUserId: data.toUserId,
        reason: 'blocked',
      });
      return;
    }

    const message = await this.messagesService.createPrivate({
      text: data.text,
      senderId: sender.id,
      senderName: sender.name || sender.email,
      toUserId: data.toUserId,
    });

    const senderSockets = this.onlineUsers.get(sender.id);
    senderSockets?.forEach((socketId) => {
      this.server.to(socketId).emit('private_message', message);
    });

    const recipientSockets = this.onlineUsers.get(data.toUserId);
    recipientSockets?.forEach((socketId) => {
      this.server.to(socketId).emit('private_message', message);
    });
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { toUserId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const sender = client.data.user;
    if (!sender) return;

    // шинэ: блоклогдсон бол "бичиж байна" ч харуулахгvй
    const blocked = await this.blockedUsersService.isBlocked(
      sender.id,
      data.toUserId,
    );
    if (blocked) return;

    const recipientSockets = this.onlineUsers.get(data.toUserId);
    recipientSockets?.forEach((socketId) => {
      this.server.to(socketId).emit('typing', {
        fromUserId: sender.id,
        isTyping: data.isTyping,
      });
    });
  }
}
