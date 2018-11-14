let config: Config = null;

// Try / catch only in test mode
try {
    config = require(__dirname + '/../../.env.js'); // get it from project root folder
} catch (e) {
    console.warn(`No config file was loaded. Create .env.js in project root folder.`);
}


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