import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  checkHealth() {
    return {
      success: true,
      message: 'Backend server running successfully',
    };
  }
}
//day 2 https://chatgpt.com/share/6a13da7b-49fc-83eb-a8c0-9ead4a1aebf7
//day 2 user black https://chatgpt.com/share/6a13da7b-49fc-83eb-a8c0-9ead4a1aebf7
