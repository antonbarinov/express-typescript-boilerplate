// App begins
import express from 'express';
import config from 'helpers/config';
import * as amqp from 'helpers/amqp';

export const app = express();

// Middleware before routing
import 'middleware/onRequest';
import 'middleware/bodyParser';
import 'middleware/pgsqlForRequest';
// Middleware before routing - END


// Routing
import 'routes/user';
// Routing -- END


// Middleware after routing
import 'middleware/errorsHandle';
// Middleware after routing - END


(async () => {
    // Connect to RabbitMQ server
    //await amqp.init(config.rabbitMQ);

    // Listen api
    app.listen(3000, () => console.log('App listening on port 3000!'));
})();