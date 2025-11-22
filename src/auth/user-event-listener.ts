import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class UserEventsListener {
  @OnEvent('user.created')
  handleUserCreated(userId: string) {
    console.log('🔔 EVENT: user.created ->', userId);
  }

  @OnEvent('user.send-verification-code')
  handleSendVerification(payload: { userId: string; otp: string }) {
    console.log('📨 EVENT: send-verification ->', payload);
  }
}
