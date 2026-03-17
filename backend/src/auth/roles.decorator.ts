import { SetMetadata } from '@nestjs/common';

// Decorator: Markiert einen Endpoint mit den erlaubten Rollen.
// Verwendung: @Roles('admin') über einem Controller-Endpoint.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
