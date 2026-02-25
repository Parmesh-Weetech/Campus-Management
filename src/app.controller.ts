import { Body, Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { LogAround } from './app/common/logger/log-around';

@Controller("app")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @LogAround()
  getHello(@Body() body: any): string {
    return this.appService.getHello(body);
  }
}
