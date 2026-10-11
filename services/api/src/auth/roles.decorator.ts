import { SetMetadata } from '@nestjs/common';

type Role = 'ADMIN' | 'FACULTY' | 'STUDENT';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
