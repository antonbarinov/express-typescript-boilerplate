const config: Config = require(__dirname + '/../../.env.js'); // get it from project root folder or somewhere else


interface Config {
    postgres: {
        host: string;
        database: string;
        user: string;
        password: string;
        port: number;
        ssl?: boolean;
        
        max?: number;
        idleTimeoutMillis?: number;
        connectionTimeoutMillis?: number;
    },
    redis: {
        host: string;
        port?: number;
        password?: string;
    }
}

export default config;