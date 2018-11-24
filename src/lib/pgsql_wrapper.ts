import { Pool, Client } from 'pg';
import * as pgTypes from 'pg';

// Bigints to int instead of string
const types = require('pg').types;
types.setTypeParser(20,  (val) => parseInt(val));
// Bigints to int instead of string -- END


let tablesColumnsCache = {};


// Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
const escapeIdentifier = function (str: string) {
    let escaped = '"';

    for (let i = 0; i < str.length; i++) {
        let c = str[i];
        if (c === '"') {
            escaped += c + c
        } else {
            escaped += c
        }
    }

    escaped += '"';

    return escaped;
};

// Ported from PostgreSQL 9.2.4 source code in src/interfaces/libpq/fe-exec.c
const escapeLiteral = function (str: string, wrapInQuotes: boolean = true) {
    str = `${str}`;
    let hasBackslash = false;
    let escaped = '\'';
    if (!wrapInQuotes) escaped = '';

    for (let i = 0; i < str.length; i++) {
        let c = str[i];
        if (c === '\'') {
            escaped += c + c
        } else if (c === '\\') {
            escaped += c + c;
            hasBackslash = true;
        } else {
            escaped += c;
        }
    }

    if (wrapInQuotes) escaped += '\'';

    if (hasBackslash === true) {
        escaped = ' E' + escaped;
    }

    return escaped;
};

function applyParamsToQuery(query, params = {}) {
    for (let k in params) {
        if (!params.hasOwnProperty(k)) continue;

        while (query.includes(':' + k)) {
            query = query.replace(':' + k, escapeLiteral(params[k]));
        }
    }

    return query;
}

const sleep = (ms: number) => new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
});


class PgWrapper {
    private transactionsPool: pgTypes.Pool = null;
    private simplePool: pgTypes.Client[] = [];
    private config = {};
    private clientsPoolIndex = 0;

    constructor(config = {}) {
        this.config = config;
    }

    /**
     * Get database QueryBuilder client from transactions pool, each client must be released via client.release()
     */
    async getTransactionClient(): Promise<PgQueryBuilder> {
        if (this.transactionsPool === null) {
            const pool = new Pool(this.config);
                
            pool.on('error', (e) => {
                console.error('PostgesSQL ', e.message);
            });

            this.transactionsPool = pool;
        }

        const client = await this.transactionsPool.connect();

        return new PgQueryBuilder(client);
    }

    /**
     * Create db connection client
     */
    private async connectClient(index: number): Promise<boolean> {
        const client = new Client(this.config);
        client.on('error', (e) => {
            console.error('PostgesSQL ', e.message);
        });
        
        // @ts-ignore
        client.on('end', async (e) => {
            console.log('PostgresSQL client disconnected!');
            
            await this.connectClient(index);
        });

        let connect = false;
        while (!connect) {
            try {
                await client.connect();
                connect = true;
                console.log('PostgresSQL client connected!');
            } catch (e) {
                await sleep(500);
            }
        }

        // @ts-ignore
        this.simplePool[index] = client;

        return true;
    }

    /**
     * Get db client for non transactional queries, that don't need to be released
     */
    async getClient(): Promise<PgQueryBuilder> {
        if (this.simplePool.length == 0) {
            for (let i = 0; i < 2; i++) {
                await this.connectClient(i);
            }
        }
        

        if (this.clientsPoolIndex >= this.simplePool.length) this.clientsPoolIndex = 0;
        let client = this.simplePool[this.clientsPoolIndex];
        this.clientsPoolIndex++;

        return new PgQueryBuilder(client);
    }
}

interface KeyValObj {
    [index: string]: any; 
};


export class PgQueryBuilder {
    private __queryData = {};
    client: pgTypes.PoolClient | pgTypes.Client = null;
    private isInTransaction = false;
    private isReleased = false;

    escape = escapeLiteral;
    escapeColumn = escapeIdentifier;

    constructor(client: pgTypes.PoolClient | pgTypes.Client) {
        this.client = client;
    }

    /**
     * Reset query builder
     */
    resetQueryBuilder(): void {
        this.__queryData = {};
    }

    /**
     * Release connection from transations pool
     */
    async release() {
        // @ts-ignore
        if (typeof this.client.release === 'function' && !this.isReleased) {
            await this.rollbackTransaction(); // In case of forgotten transactions
            // @ts-ignore
            this.client.release();
            this.isReleased = true;            
        }
    }

    /**
     * Add escaped value to query builder
     */
    add(column: string, value: any): PgQueryBuilder {
        if (typeof value == 'object')  {
            value = JSON.stringify(value);
        } else {
            value = '' + value;
        }
    
        value = escapeLiteral(value, true);

        this.__queryData[column] = {
            column,
            value,
            set: true
        }

        return this;
    }

    /**
     * Add unescaped value to query builder
     */
    addCustom(column: string, value: any): PgQueryBuilder {
        value = '' + value;   

        this.__queryData[column] = {
            column,
            value,
            set: true
        }

        return this;
    }

    /**
     * Add value that must be incremented to query builder
     */
    increment(column: string, value: any): PgQueryBuilder {
        value = escapeLiteral(value + '', true);

        this.__queryData[column] = {
            column,
            value,
            increnemt: true
        }

        return this;
    }

    /**
     * Add value that must be decrenemted to query builder
     */
    decrenemt(column: string, value: any): PgQueryBuilder {
        value = escapeLiteral(value + '', true);

        this.__queryData[column] = {
            column,
            value,
            decrenemt: true
        }

        return this;
    }

    /**
     * Bulk add escaped values to query builder
     */
    bulkAdd(data: KeyValObj): PgQueryBuilder {
        for (let column in data) {
            if (!data.hasOwnProperty(column)) continue;
    
            this.add(column, data[column]);
        }

        return this;
    }

    /**
     * Insert query string
     */
    private getInsertQuery(tableFields: {}): string {
        let columns: any = [];
        let values: any = [];
        for (let key in this.__queryData) {
            if (tableFields[key] === undefined) continue;
            const res = this.__queryData[key];
            const column = escapeIdentifier(res.column);

            columns.push(column);
            values.push(res.value);
        }

        return `(${columns}) VALUES (${values})`;
    }

    /**
     * Update query string
     */
    private getUpdateQuery(tableFields: {}): string {
        let updateStr: any = [];
        for (let key in this.__queryData) {
            if (tableFields[key] === undefined) continue;
            const res = this.__queryData[key];
            const column = escapeIdentifier(res.column);
            
            if (res.set) {
                updateStr.push(`${column} = ${res.value}`);
            } else {
                let sign = '+';
                if (res.decrenemt) sign = '-';
                updateStr.push(`${column} = ${column} ${sign} ${res.value}`);
            }
        }
        
        return updateStr.join(',');
    }

    /**
     * Get fields in table
     */
    private async getFieldsObject(tableName: string): Promise<{}> {
        const cache = tablesColumnsCache[tableName];
        if (cache) return cache;
    
    
        let result = {};
        let res = await this.select(`SELECT column_name FROM information_schema.columns WHERE table_name = ${this.escape(tableName)}`);
        if (!res.length) return {};
    
        res.forEach(r => {
            result[r.column_name] = 1;
        });
    
        tablesColumnsCache[tableName] = result;
    
        setTimeout(() => {
            delete tablesColumnsCache[tableName];
        }, 15000);
    
        return result;
    }

    /**
     * SQL query
     */
    async query(query: string, params?: {}): Promise<pgTypes.QueryArrayResult> {
        query = applyParamsToQuery(query, params);

        try {
            return await this.client.query(query);
        }
        catch (e) {
            console.error(`ERROR WHEN SQL QUERY: ${query} [${e.message}]`);

            throw e;
        }
    }

    /**
     * Select rows
     */
    async select(query: string, params = {}): Promise<any[]> {
        query = applyParamsToQuery(query, params);

        const res = await this.query(query);
        return res.rows || [];
    }

    /**
     * Select one row as object or false if no results was found
     */
    async selectOne(query: string, params = {}): Promise<boolean | {}> {
        query = query.trim();
        if (query.indexOf(';') == query.length - 1) {
            query = query.substr(0, query.length - 1);
        }

        if (query.indexOf('LIMIT 1') != query.length - 7) query += ' LIMIT 1';

        let res = await this.select(query, params);
        return res.length ? res[0] : false;
    }

    /**
     * Insert into table
     */
    async insert(tableName: string, returning: boolean | string = false): Promise<boolean | {}> {
        tableName = tableName.trim();

        const tableFields = await this.getFieldsObject(tableName);
        const insertStr = this.getInsertQuery(tableFields);
    
        let ret = '';
        if (returning === true) {
            ret = 'RETURNING *';
        } else if (typeof returning == 'string') {
            ret = `RETURNING ${returning}`;
        }
    
        const query = `INSERT INTO ${escapeIdentifier(tableName)} ${insertStr} ${ret}`;
    
        const res = await this.query(query);
        if (res.rows.length) return res.rows[0];
    
        return true;
    }

    /**
     * Insert or Update
     * @param tableName table name
     * @param conflictFields Example: 'user_id, device_type'
     */
    async upsert(tableName: string, conflictFields: string, returning: boolean | string = false): Promise<boolean | {}> {
        tableName = tableName.trim();

        const tableFields = await this.getFieldsObject(tableName);
        const insertStr = this.getInsertQuery(tableFields);
        const updateStr = this.getUpdateQuery(tableFields);
    
        let ret = '';
        if (returning === true) {
            ret = 'RETURNING *';
        } else if (typeof returning == 'string') {
            ret = `RETURNING ${returning}`;
        }
    
        const query = `
            INSERT INTO 
            ${escapeIdentifier(tableName)}
            ${insertStr}
            ON CONFLICT (${conflictFields}) 
            DO UPDATE
            SET ${updateStr}
            ${ret}
        `;
    
        const res = await this.query(query);
        if (res.rows.length) return res.rows[0];
    
        return true;
    }
    
    /**
     * Update
     */
    async update(tableName: string, where: string = '', params = {}, returning: string | boolean = false): Promise<number | {}> {
        tableName = tableName.trim();

        const tableFields = await this.getFieldsObject(tableName);
        const updateStr = this.getUpdateQuery(tableFields);
    
        where = applyParamsToQuery(where, params);
    
        let query = `UPDATE ${escapeIdentifier(tableName)} SET ${updateStr}`;
        if (where) query += ' WHERE ' + where;
        if (returning === true) {
            query += ' RETURNING *';
        } else if (typeof returning === 'string') {
            query += ` RETURNING ${returning}`;
        }
    
        const res = await this.query(query);

        if (returning !== false) {
            if (res.rows.length) return res.rows[0];
            return res.rows;
        } else {
            return res.rowCount;
        }
    }

    /**
     * Begin transaction
     */
    async beginTransaction(): Promise<boolean> {
        if (this.isInTransaction) return false;
        // @ts-ignore
        if (this.client.release === undefined) throw `For transactions you must use client from pgPool!`;

        this.isInTransaction = true;
        await this.query('BEGIN');

        return true;
    }

    
    /**
     * Commit transaction
     */
    async commitTransaction(): Promise<boolean> {
        if (!this.isInTransaction) return false;

        this.isInTransaction = false;
        let res;
        try {
            res = await this.query('COMMIT');
            return true;
        }
        catch (e) {
            res = await this.query('ROLLBACK');
            return false;
        }
    }

    /**
     * Rollback transaction
     */
    async rollbackTransaction(): Promise<boolean> {
        if (!this.isInTransaction) return false;

        this.isInTransaction = false;
        await this.query('ROLLBACK');

        return true;
    }
}



export default PgWrapper;
