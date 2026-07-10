import mongoose from 'mongoose';
import { configService, Database } from '../config/env.config';
import { Logger } from '../config/logger.config';

const logger = new Logger('MongoDB');

const db = configService.get<Database>('DATABASE');
// Pegamos o provedor diretamente das variáveis de ambiente
const provider = process.env.DATABASE_PROVIDER;

export const dbserver = (() => {
  // A condição agora exige que o DB esteja habilitado E que o provider NÃO seja postgresql
  if (db.ENABLED && provider !== 'postgresql') {
    logger.verbose('connecting');
    const dbs = mongoose.createConnection(db.CONNECTION.URI, {
      dbName: db.CONNECTION.DB_PREFIX_NAME + '-whatsapp-api',
    });
    
    logger.verbose('connected in ' + db.CONNECTION.URI);
    logger.info('ON - dbName: ' + dbs['$dbName']);

    process.on('beforeExit', () => {
      logger.verbose('instance destroyed');
      // Verificamos se dbs existe antes de destruir
      if (dbs) {
        dbs.destroy(true, (error) => logger.error(error));
      }
    });

    return dbs;
  } else {
    // Log para você confirmar no console que ele pulou o MongoDB corretamente
    logger.info('MongoDB ignorado: Utilizando PostgreSQL como provedor de banco de dados.');
    return undefined; 
  }
})();
