/**
 * Helper para enviar logs customizados ao New Relic
 * 
 * Uso:
 *   import { newRelicLog } from './common/utils/newrelic-logger';
 *   newRelicLog('info', 'Mensagem importante', { userId: '123', action: 'login' });
 */

let newrelic: any = null;

try {
  newrelic = require('newrelic');
} catch (error) {
  // New Relic não está disponível (desenvolvimento sem .env, etc)
}

export function newRelicLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  attributes?: Record<string, any>,
) {
  // Sempre logar no console também
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  switch (level) {
    case 'error':
      console.error(logMessage, attributes || '');
      break;
    case 'warn':
      console.warn(logMessage, attributes || '');
      break;
    case 'debug':
      console.debug(logMessage, attributes || '');
      break;
    default:
      console.log(logMessage, attributes || '');
  }

  // Enviar para New Relic se disponível
  if (newrelic) {
    try {
      // Adicionar atributos customizados à transação atual
      if (attributes) {
        Object.keys(attributes).forEach((key) => {
          newrelic.addCustomAttribute(key, attributes[key]);
        });
      }

      // Registrar evento customizado
      newrelic.recordCustomEvent('CustomLog', {
        level,
        message,
        timestamp,
        ...attributes,
      });

      // Para erros, também registrar como erro
      if (level === 'error') {
        newrelic.noticeError(new Error(message), {
          ...attributes,
          customLevel: level,
        });
      }
    } catch (error: any) {
      // Se falhar ao enviar para New Relic, apenas logar no console
      console.warn('⚠️ Erro ao enviar log para New Relic:', error.message);
    }
  }
}

/**
 * Registrar métrica customizada
 */
export function newRelicMetric(name: string, value: number, unit?: string) {
  if (newrelic) {
    try {
      newrelic.recordMetric(name, value);
      if (unit) {
        newrelic.addCustomAttribute(`${name}_unit`, unit);
      }
    } catch (error: any) {
      console.warn('⚠️ Erro ao registrar métrica no New Relic:', error.message);
    }
  }
}

/**
 * Adicionar atributo customizado à transação atual
 */
export function newRelicAttribute(key: string, value: any) {
  if (newrelic) {
    try {
      newrelic.addCustomAttribute(key, value);
    } catch (error: any) {
      console.warn('⚠️ Erro ao adicionar atributo no New Relic:', error.message);
    }
  }
}

