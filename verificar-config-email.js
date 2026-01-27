// Script para verificar configuração de email
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

console.log('\n📧 Verificando configuração de email...\n');

const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASSWORD;
const mailService = process.env.MAIL_SERVICE;
const mailHost = process.env.MAIL_HOST;
const mailPort = process.env.MAIL_PORT;

console.log('Variáveis encontradas:');
console.log(`  MAIL_SERVICE: ${mailService || '❌ NÃO CONFIGURADO'}`);
console.log(`  MAIL_HOST: ${mailHost || '❌ NÃO CONFIGURADO'}`);
console.log(`  MAIL_PORT: ${mailPort || '❌ NÃO CONFIGURADO'}`);
console.log(`  MAIL_USER: ${mailUser ? mailUser.substring(0, 3) + '***' : '❌ NÃO CONFIGURADO'}`);
console.log(`  MAIL_PASSWORD: ${mailPass ? '✅ Configurado (' + mailPass.replace(/\s/g, '').length + ' caracteres)' : '❌ NÃO CONFIGURADO'}`);

if (!mailUser || !mailPass) {
  console.log('\n❌ ERRO: MAIL_USER ou MAIL_PASSWORD não estão configurados!');
  console.log('\n📝 Configure no arquivo .env ou .env.local:');
  console.log('   MAIL_SERVICE=gmail');
  console.log('   MAIL_USER=seu-email@gmail.com');
  console.log('   MAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Senha de aplicativo de 16 dígitos');
  console.log('\n🔗 Gere senha de aplicativo em: https://myaccount.google.com/apppasswords');
  process.exit(1);
}

const passLength = mailPass.replace(/\s/g, '').length;
if (passLength < 16) {
  console.log('\n⚠️  AVISO: A senha parece ter menos de 16 caracteres!');
  console.log('   Para Gmail, você DEVE usar uma SENHA DE APLICATIVO de 16 dígitos.');
  console.log('   Não use a senha normal da conta do Gmail.');
  console.log('\n🔗 Gere senha de aplicativo em: https://myaccount.google.com/apppasswords');
}

if (mailUser && !mailUser.includes('@gmail.com') && mailService !== 'gmail') {
  console.log('\n⚠️  AVISO: Email não é Gmail, mas MAIL_SERVICE não está configurado.');
}

console.log('\n✅ Configuração básica encontrada!');
console.log('\n💡 Dica: Se ainda receber erro 535, verifique:');
console.log('   1. Verificação em duas etapas está ativada no Google');
console.log('   2. Senha de aplicativo foi gerada corretamente');
console.log('   3. A senha de aplicativo tem exatamente 16 caracteres (sem espaços)');
console.log('   4. Reiniciou o servidor após atualizar o .env\n');

