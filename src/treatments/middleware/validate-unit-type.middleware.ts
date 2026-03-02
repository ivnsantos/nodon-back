import { Injectable, NestMiddleware, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { VALID_UNIT_TYPES } from '../enums/unit-type.enum';

@Injectable()
export class ValidateUnitTypeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const body = req.body;
    
    // Verificar se unitType está presente no body
    if (body.unitType && body.unitType !== null) {
      if (!VALID_UNIT_TYPES.includes(body.unitType)) {
        throw new BadRequestException(
          `Tipo de unidade inválido. Tipos aceitos: ${VALID_UNIT_TYPES.join(', ')}`
        );
      }
    }
    
    next();
  }
}
