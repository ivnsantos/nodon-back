import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(configService: ConfigService) {
    const clientID = configService.get<string>('FACEBOOK_APP_ID');
    const clientSecret = configService.get<string>('FACEBOOK_APP_SECRET');
    const isProd = configService.get<string>('NODE_ENV') === 'production';
    const callbackURL = isProd
      ? configService.get<string>('FACEBOOK_CALLBACK_URL_PROD', 'https://nodon.com.br/api/auth/facebook/callback')
      : configService.get<string>('FACEBOOK_CALLBACK_URL', 'http://localhost:5000/api/auth/facebook/callback');

    console.log('Facebook OAuth Config:');
    console.log('  - Environment:', isProd ? 'PRODUCTION' : 'DEVELOPMENT');
    console.log('  - App ID:', clientID ? `${clientID.substring(0, 10)}...` : 'NÃO CONFIGURADO');
    console.log('  - App Secret:', clientSecret ? '****configurado****' : 'NÃO CONFIGURADO');
    console.log('  - Callback URL:', callbackURL);

    // Validar se as credenciais estão configuradas
    if (!clientID || !clientSecret) {
      console.warn('⚠️ Facebook OAuth não configurado. FACEBOOK_APP_ID e FACEBOOK_APP_SECRET são necessários.');
      console.warn('⚠️ O login com Facebook não estará disponível até que as credenciais sejam configuradas.');
      // Fornecer valores válidos mas que não funcionarão para evitar erro de inicialização
      // O guard verificará se as credenciais estão configuradas antes de usar
      super({
        clientID: clientID || 'not-configured',
        clientSecret: clientSecret || 'not-configured',
        callbackURL: callbackURL,
        scope: ['email', 'public_profile'],
        profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
      });
    } else {
      super({
        clientID: clientID,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        scope: ['email', 'public_profile'],
        profileFields: ['id', 'emails', 'name', 'displayName', 'photos'],
      });
    }
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): void {
    console.log('Facebook Profile recebido:', JSON.stringify(profile, null, 2));
    
    const { id, name, emails, photos } = profile;
    
    const user = {
      facebookId: id,
      email: emails?.[0]?.value || null,
      nome: name ? `${name.givenName} ${name.familyName}` : profile.displayName,
      foto: photos?.[0]?.value || null,
    };

    console.log('Usuário extraído:', user);
    
    return done(null, user);
  }
}

