import * as express from 'express';

interface ArrayOfStrings {
    [index: number]: string;
}


export function badRequest(req: express.Request, res: express.Response, next: express.NextFunction, message?: string | ArrayOfStrings, errorCode?: number) {
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

    if (errorCode) result.errorCode = errorCode;

    res.status(500);
    req.response = result;

    next();
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

    next();
}

export function unauthorized(req: express.Request, res: express.Response, next: express.NextFunction, message?: string | ArrayOfStrings) {
    let msg = 'Unauthorized';
    let msgs = [];

    if (message !== undefined) {
        if (typeof message === 'string') msgs.push(message);
        
        if (Array.isArray(message)) {
            msg = msgs.join(';\n');
        }
    }

    res.status(401);
    req.response = {
        status: 'FAIL',
        message: msg,
    };

    next();
}

export function successResponse(req: express.Request, res: express.Response, next: express.NextFunction, data?: any) {
    req.response = {
        status: 'OK',
        ...data
    };

    next();
}