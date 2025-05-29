import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './shared/security/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  
  @Public()
  @Get()
  getStatus(): string {
    return this.appService.getStatus();
  }
}
