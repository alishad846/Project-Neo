import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('api/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // This creates a POST route at http://localhost:3000/api/ai/extract
  @Post('extract')
  async extractData(@Body('text') text: string) {
    // It catches the text you send from Postman and passes it to your engine
    return this.aiService.processProductDescription(text);
  }
}