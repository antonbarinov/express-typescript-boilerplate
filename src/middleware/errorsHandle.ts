import * as express from 'express';


export default (app: express.Express) => {
    app.use((err, req, res, next) => {
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
