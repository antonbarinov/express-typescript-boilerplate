import crypto from 'crypto';
import express from 'express';

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

        let msg = err.message;

        console.error(`[${req.method} ${req.url}]`, err.message, err.stack);

        if (process.env.NODE_ENV === 'production') msg = 'Internal server error';
    
        res.status(500);
        res.send({
            status: 'FAIL',
            message: msg,
        });
    });
}