import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    // Pegar apenas o path sem query strings
    const path = request.path || request.url?.split('?')[0];
    
    // Rotas que devem retornar dados diretamente sem wrapper
    const skipTransformPaths = [
      '/api/pacientes/buscar',
    ];
    
    // Se a rota está na lista de exceções, retornar dados diretamente
    if (skipTransformPaths.some(skipPath => path?.includes(skipPath))) {
      return next.handle();
    }
    
    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: 'Success',
        data,
      })),
    );
  }
}

