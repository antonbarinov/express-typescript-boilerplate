import amqp from 'amqplib';
import nodemailer from 'nodemailer';

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
    },
    rabbitMQ: {
        protocol: string;
        hostname: string;
        port: number;
        username: string;
        password: string;
        locale?: string;
        frameMax?: number;
        heartbeat?: number;
        vhost: string;
    },
    nodeMailerSMTP: {
        host: string,
        port: number,
        secure: boolean, // true for 465, false for other ports
        auth: {
            user: string,
            pass: string
        }
    },
    microServicesChannels: {
        emailSender: string;
    }
}


export default config;