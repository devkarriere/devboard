import { Injectable } from '@nestjs/common';
import { Subject, Observable, merge, interval } from 'rxjs';
import { map, filter } from 'rxjs/operators';

export interface SseEvent {
  userId: string;
  type: string;
  data: Record<string, unknown>;
}

@Injectable()
export class SseService {
  // Ein zentraler Subject-Stream für alle Events
  private events$ = new Subject<SseEvent>();

  // Neues Event an einen bestimmten User senden
  emit(event: SseEvent): void {
    console.log(`SSE Event emittiert für User ${event.userId}:`, event.type);
    this.events$.next(event);
  }

  // SSE-Stream für einen bestimmten User zurückgeben (mit Heartbeat)
  subscribe(userId: string): Observable<MessageEvent> {
    // Heartbeat alle 30 Sekunden, damit die Verbindung offen bleibt
    const heartbeat$ = interval(30_000).pipe(
      map(() => ({ data: JSON.stringify({ type: 'heartbeat' }) }) as MessageEvent),
    );

    // Nur Events für diesen User durchlassen
    const userEvents$ = this.events$.asObservable().pipe(
      filter((event) => event.userId === userId),
      map(
        (event) =>
          ({
            data: JSON.stringify({ type: event.type, ...event.data }),
          }) as MessageEvent,
      ),
    );

    return merge(heartbeat$, userEvents$);
  }
}
