import * as winston from 'winston';

// Configuração do Winston - apenas console
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
  ),
  transports: [
    // Apenas console
    new winston.transports.Console()
  ]
});

export function newRelicLog(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  attributes?: Record<string, any>,
) {
  const logData = {
    message,
    timestamp: new Date().toISOString(),
    ...attributes
  };

  switch (level) {
    case 'error':
      logger.error(logData);
      break;
    case 'warn':
      logger.warn(logData);
      break;
    case 'debug':
      logger.debug(logData);
      break;
    default:
      logger.info(logData);
  }
}

/**
 * Logger específico para eventos de negócio
 */
export function logBusiness(event: string, attributes?: Record<string, any>) {
  logger.info({
    event,
    type: 'business',
    timestamp: new Date().toISOString(),
    ...attributes
  });
}

/**
 * Logger específico para erros
 */
export function logError(error: Error, context?: string, attributes?: Record<string, any>) {
  logger.error({
    message: error.message,
    stack: error.stack,
    context,
    type: 'error',
    timestamp: new Date().toISOString(),
    ...attributes
  });
}

/**
 * Logger específico para eventos de autenticação
 */
export function logAuth(event: string, email?: string, attributes?: Record<string, any>) {
  logger.info({
    event,
    email,
    type: 'auth',
    timestamp: new Date().toISOString(),
    ...attributes
  });
}

/**
 * Registrar métrica customizada
 */
export function newRelicMetric(name: string, value: number, unit?: string) {
  logger.info({
    metric: name,
    value,
    unit,
    type: 'metric',
    timestamp: new Date().toISOString()
  });
}

/**
 * Adicionar atributo customizado
 */
export function newRelicAttribute(key: string, value: any) {
  logger.info({
    attribute: key,
    value,
    type: 'attribute',
    timestamp: new Date().toISOString()
  });
}

// Exportar o logger para uso direto se necessário
export { logger };

