import crypto from 'crypto';
import express from 'express';
import { sendResponse } from './responses';

export function getRandonInt(min: number, max: number): number {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    rand = Math.round(rand);
    return rand;
}

export function getUserHash(email: string, password: string, algo = 'sha512'): string {
    const secret = '!@####@!abcdefg9-+';
    return crypto.createHmac(algo, secret)
        .update(`${email}   ${password}`)
        .digest('hex');
};

export function getRandomHash(algo = 'sha256'): string {
    const secret = new Date() + Math.random().toString() + Math.random().toString() + Math.random().toString();
    return crypto.createHmac(algo, secret)
        .update(new Date().getTime().toString() + Math.random().toString() + Math.random().toString())
        .digest('hex');
};

// Wrap only Express.js route or middleware functions
export const asyncWrapper = (fn: (req?: express.Request, res?: express.Response, next?: express.NextFunction) => Promise<void>) => (...args) => {
    fn(...args)
    .then(() => {
        const next: express.NextFunction = args[2];
        next();
    })
    .catch((err: Error) => {
        const req: express.Request = args[0];
        const res: express.Response = args[1];
        const next: express.NextFunction = args[2];

        handleExpressUnexpectedError(err, req, res, next);
    });
}

export const sleep = (ms: number) => new Promise((resolve) => {
    setTimeout(() => resolve(), ms);
});

export function handleExpressUnexpectedError(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
    let msg = err.message;

    console.error(`[${req.method} ${req.url}]`, err.message, err.stack);

    if (process.env.NODE_ENV === 'production') msg = 'Internal server error';

    // Release PostresSQL connection back to pool
    req.__dbClient?.release();

    res.status(500);
    req.response = {
        status: 'FAIL',
        message: msg,
        messages: [ msg ]
    };

    sendResponse(req, res);
}