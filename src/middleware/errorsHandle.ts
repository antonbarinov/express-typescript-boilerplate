import * as express from 'express';
import { sendResponse } from 'helpers/responses';


export default (app: express.Express) => {
    app.use((err, req, res, next) => {
        let msg = err.message;
    
        console.error(`[${req.method} ${req.url}]`, err.message, err.stack);
    
        if (process.env.NODE_ENV === 'production') msg = 'Internal server error';

    
        res.status(500);
        req.response = {
            status: 'FAIL',
            message: msg,
            messages: [ msg ]
        };

        sendResponse(req, res);
    });
}
