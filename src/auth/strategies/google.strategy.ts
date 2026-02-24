import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const isProd = configService.get<string>('NODE_ENV') === 'production';
    const callbackURL = isProd 
      ? configService.get<string>('GOOGLE_REDIRECT_URI_PROD')
      : configService.get<string>('GOOGLE_REDIRECT_URI');

    console.log('Google OAuth Config:');
    console.log('  - Environment:', isProd ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('  - Client ID:', clientID ? `${clientID.substring(0, 20)}...` : 'NÃO CONFIGURADO');
    console.log('  - Client Secret:', clientSecret ? '****configurado****' : 'NÃO CONFIGURADO');
    console.log('  - Callback URL:', callbackURL);

    // Validar se as credenciais estão configuradas
    if (!clientID || !clientSecret) {
      console.warn('⚠️ Google OAuth não configurado. GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET são necessários.');
      console.warn('⚠️ O login com Google não estará disponível até que as credenciais sejam configuradas.');
      // Fornecer valores válidos mas que não funcionarão para evitar erro de inicialização
      // O guard verificará se as credenciais estão configuradas antes de usar
      super({
        clientID: clientID || 'not-configured',
        clientSecret: clientSecret || 'not-configured',
        callbackURL: callbackURL,
        scope: ['email', 'profile'],
      });
    } else {
      super({
        clientID: clientID,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        scope: ['email', 'profile'],
      });
    }
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    console.log('Google Profile recebido:', JSON.stringify(profile, null, 2));
    
    const { id, name, emails, photos } = profile;
    
    const user = {
      googleId: id,
      email: emails?.[0]?.value,
      nome: name ? `${name.givenName} ${name.familyName}` : profile.displayName,
      foto: photos?.[0]?.value || null,
    };

    console.log('Usuário extraído:', user);
    
    // Chamar done com null para erro e user para o usuário
    return done(null, user);
  }
}
