import { User } from './user';
import Redis from 'ioredis';
import * as pgsqlWrapper from 'lib/pgsql_wrapper';


declare global {
    namespace Express {
        interface Request {
            user?: User;
            getTransactionsDbClient() : Promise<pgsqlWrapper.PgQueryBuilder>;
            getDbClient() : Promise<pgsqlWrapper.PgQueryBuilder>;
            __dbClient: pgsqlWrapper.PgQueryBuilder | null;
            __performanceStart: number;
            redisClient: Redis.Redis;
            response: any;
        }
    }
}