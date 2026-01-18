import { PartialType } from '@nestjs/mapped-types';
import { CreateDesenhoProfissionalDto } from './create-desenho-profissional.dto';

export class UpdateDesenhoProfissionalDto extends PartialType(CreateDesenhoProfissionalDto) {}
