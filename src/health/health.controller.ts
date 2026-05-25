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
// https://chatgpt.com/share/6a13da7b-49fc-83eb-a8c0-9ead4a1aebf7
