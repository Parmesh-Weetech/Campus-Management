import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(body): string {
    body.name = "parmesh";
    body.name = body.name.toLowerCase();
    return body
  }
}