import { IsUUID, IsNotEmpty } from 'class-validator';

export class AtivarAnamneseDto {

  @IsNotEmpty()
  id: string;
}

export class DesativarAnamneseDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;
}

