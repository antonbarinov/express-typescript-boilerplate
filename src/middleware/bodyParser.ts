import * as express from 'express';
import bodyParser from 'body-parser';


export default (app: express.Express) => {
    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }));

    // parse application/json
    app.use(bodyParser.json());
}
