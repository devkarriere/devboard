import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

// Guard: Prüft ob der User die erforderliche Rolle hat.
// Wird zusammen mit dem @Roles()-Decorator verwendet.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Benötigte Rollen aus dem @Roles()-Decorator lesen
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Kein @Roles()-Decorator → jeder eingeloggte User darf zugreifen
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userRole = request.userRole;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Keine Berechtigung für diese Aktion');
    }

    return true;
  }
}
