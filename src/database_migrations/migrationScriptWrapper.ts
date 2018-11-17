import * as pgsqlWrapper from 'lib/pgsql_wrapper';

export default (fn: (client: pgsqlWrapper.PgQueryBuilder) => Promise<boolean>) => fn;