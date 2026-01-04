import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class IsMasterGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean;
}
