import * as express from 'express';
import PgPoolNew from 'lib/pgsql_wrapper';
import config from 'helpers/config';
import Redis from 'ioredis';

// Init PostresSQL connections pool
const pgPoolNew = new PgPoolNew(config.postgres);
//const redisClient = new Redis(config.redis);



export default (app: express.Express) => {
    app.use(async (req, res, next) => {
        req.__dbClient = null;

        // Get PostresSQL connection from pool (use only for Transactions)
        req.getTransactionsDbClient = async () => {
            if (req.__dbClient !== null) return req.__dbClient;

            req.__dbClient = await pgPoolNew.getTransactionClient();            
            return req.__dbClient;
        }

        // Get PostresSQL connection from pool
        req.getDbClient = async () => pgPoolNew.getClient();

        // Redis client
        //req.redisClient = redisClient;
        
        res.on('finish', () => {
            try {
                // Release PostresSQL connection back to pool
                if (req.__dbClient !== null) req.__dbClient.release();
            } catch (e) {}
        });

        req.on('error', (err) => {
            console.error(err.message);

            try {
                // Release PostresSQL connection back to pool
                if (req.__dbClient !== null) req.__dbClient.release();
            } catch (e) {}
        });

        next();
    });
}
