import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { SseService } from './sse.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('notifications')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  // GET /notifications/sse – SSE-Verbindung für den authentifizierten User
  @UseGuards(AuthGuard)
  @Get('sse')
  sse(@Req() req: Request, @Res() res: Response) {
    const userId = (req as any).userId;
    console.log(`SSE-Verbindung hergestellt für User: ${userId}`);

    // SSE-Header setzen
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // RxJS-Observable abonnieren und als SSE-Events senden
    const subscription = this.sseService.subscribe(userId).subscribe({
      next: (event) => {
        res.write(`data: ${event.data}\n\n`);
      },
    });

    // Verbindung wird geschlossen → Subscription aufräumen
    req.on('close', () => {
      console.log(`SSE-Verbindung geschlossen für User: ${userId}`);
      subscription.unsubscribe();
    });
  }
}
