import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Hello from CursorRuleCraft Backend!',
      timestamp: new Date().toISOString(),
      authenticated: true,
    };
  }
}
