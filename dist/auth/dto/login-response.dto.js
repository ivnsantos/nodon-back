"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginResponseDto = exports.AssinaturaInfoDto = exports.PlanoInfoDto = void 0;
class PlanoInfoDto {
    id;
    nome;
    valorOriginal;
    valorPromocional;
    limiteAnalises;
    tokenChat;
    descricao;
}
exports.PlanoInfoDto = PlanoInfoDto;
class AssinaturaInfoDto {
    id;
    status;
    planoId;
    plano;
}
exports.AssinaturaInfoDto = AssinaturaInfoDto;
class LoginResponseDto {
    access_token;
    user;
}
exports.LoginResponseDto = LoginResponseDto;
//# sourceMappingURL=login-response.dto.js.map