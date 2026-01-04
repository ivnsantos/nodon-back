export class PlanoInfoDto {
  id: string;
  nome: string;
  valorOriginal: number;
  valorPromocional?: number;
  limiteAnalises: number;
  tokenChat: number;
  descricao?: string;
}

export class AssinaturaInfoDto {
  id: string;
  status: string;
  planoId: string;
  plano?: PlanoInfoDto;
}

export class LoginResponseDto {
  access_token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    tipo: 'master' | 'usuario';
    isAdmin: boolean;
    assinatura?: AssinaturaInfoDto;
  };
}

