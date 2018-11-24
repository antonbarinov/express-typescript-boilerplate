import * as express from 'express';
import { performance } from 'perf_hooks';

interface ArrayOfStrings {
    [index: number]: string;
}


export function badRequest(req: express.Request, res: express.Response, next: express.NextFunction, message?: string | ArrayOfStrings, errorCodes?: number | number[]) {
    let msg = 'Bad request';
    let msgs = [];

    if (message !== undefined) {
        if (typeof message === 'string') msgs.push(message);
        
        if (Array.isArray(message)) {
            msgs = message;
            msg = msgs.join(';\n');
        }
    }

    let result: any = {
        status: 'FAIL',
        message: msg,
        messages: msgs,
    };

    if (errorCodes) {
        // Error code can be  array like [ 100, 156 ] for clients logic
        if (!Array.isArray(errorCodes)) errorCodes = [ errorCodes ];
        result.errorCodes = errorCodes;
    }

    res.status(400);
    req.response = result;

    sendResponse(req, res);
}

export function notFound(req: express.Request, res: express.Response, next: express.NextFunction, message?: string | ArrayOfStrings) {
    let msg = 'Not found';
    let msgs = [];

    if (message !== undefined) {
        if (typeof message === 'string') msgs.push(message);
        
        if (Array.isArray(message)) {
            msgs = message;
            msg = msgs.join(';\n');
        }
    }

    res.status(404);
    req.response = {
        status: 'FAIL',
        message: msg,
        messages: msgs,
    };

    sendResponse(req, res);
}

export function unauthorized(req: express.Request, res: express.Response, next: express.NextFunction, message?: string | ArrayOfStrings) {
    let msg = 'Unauthorized';
    let msgs = [];

    if (message !== undefined) {
        if (typeof message === 'string') msgs.push(message);
        
        if (Array.isArray(message)) {
            msgs = message;
            msg = msgs.join(';\n');
        }
    }

    res.status(401);
    req.response = {
        status: 'FAIL',
        message: msg,
        messages: msgs,
    };

    sendResponse(req, res);
}

export function successResponse(req: express.Request, res: express.Response, next: express.NextFunction, data?: any) {
    req.response = {
        status: 'OK',
        ...data
    };

    sendResponse(req, res);
}

/**
 * Through this function sends all final responses to clients.
 */
export function sendResponse(req: express.Request, res: express.Response) {
    const millis = performance.now() - req.__performanceStart;
    const millisStr = millis.toFixed(2);
    res.setHeader('performance', millisStr + 'ms');
    res.send(req.response || '');
}