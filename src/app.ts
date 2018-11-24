// App begins
import express from 'express';
import config from 'helpers/config';
import * as amqp from 'helpers/amqp';

const app = express();

// Middleware before routing
import onRequest from 'middleware/onRequest';
import bodyParserMiddleware from 'middleware/bodyParser';
import pgsqlForRequestMiddleware from 'middleware/pgsqlForRequest';
onRequest(app);
pgsqlForRequestMiddleware(app);
bodyParserMiddleware(app);


// Routing
import userRoutes from 'routes/user';
userRoutes(app);
// Routing -- END


// Middleware after routing
import errorsHandleMiddleware from 'middleware/errorsHandle';
errorsHandleMiddleware(app); // Handle errors


(async () => {
    // Connect to RabbitMQ server
    await amqp.init(config.rabbitMQ);

    // Listen api
    app.listen(3000, () => console.log('App listening on port 3000!'));
})();