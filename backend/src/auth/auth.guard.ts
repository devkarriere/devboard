import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type FlattenedJWSInput, type JWSHeaderParameters, type GetKeyFunction } from 'jose';

// Guard: Prüft ob ein gültiger Supabase JWT-Token mitgesendet wird.
// Verifiziert den Token über Supabase's JWKS-Endpoint (ES256/P-256).
// Lädt die Rolle aus der Supabase profiles-Tabelle.
// Extrahiert userId und role aus dem Token und hängt sie an das Request-Objekt.
@Injectable()
export class AuthGuard implements CanActivate {
  private jwks: GetKeyFunction<JWSHeaderParameters, FlattenedJWSInput> | null = null;

  // JWKS lazy initialisieren – erst beim ersten Request, wenn .env geladen ist
  private getJWKS() {
    if (!this.jwks) {
      const supabaseUrl = process.env.SUPABASE_URL;
      if (!supabaseUrl) {
        throw new UnauthorizedException('SUPABASE_URL nicht konfiguriert');
      }
      this.jwks = createRemoteJWKSet(
        new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`),
      );
    }
    return this.jwks;
  }

  // Rolle aus der Supabase profiles-Tabelle laden
  private async fetchRole(userId: string, token: string): Promise<string> {
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!supabaseUrl || !anonKey) return 'user';

    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role`,
        {
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await res.json();
      return data?.[0]?.role || 'user';
    } catch {
      return 'user';
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    // Token aus Header oder Query-Parameter (für SSE-Verbindungen)
    let token: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (request.query?.token) {
      token = request.query.token;
    }

    if (!token) {
      throw new UnauthorizedException('Kein Token vorhanden');
    }
    const supabaseUrl = process.env.SUPABASE_URL;

    try {
      const { payload } = await jwtVerify(token, this.getJWKS(), {
        issuer: `${supabaseUrl}/auth/v1`,
      });

      // Supabase speichert die User-ID im "sub" Feld
      const userId = payload.sub as string;
      request.userId = userId;
      request.token = token;

      // Rolle aus der profiles-Tabelle laden (nicht aus dem Token,
      // da Supabase die Rolle dort nicht automatisch einbettet)
      request.userRole = await this.fetchRole(userId, token);

      return true;
    } catch {
      throw new UnauthorizedException('Ungültiger Token');
    }
  }
}
