import { Validate } from '@antonbarinov/ovalidator';
import { badRequest, successResponse } from 'helpers/responses';
import { asyncWrapper } from 'helpers/functions';

// Validation schema
import validationSchema from './validator_schema';
import { amqpSendEmail } from 'helpers/amqp';


export default asyncWrapper(async (req, res, next) => {
    const data = req.body;
    
    // Validate body params
    let validationErrors = Validate(validationSchema, data) || [];
    if (validationErrors.length) return badRequest(req, res, next, validationErrors);

    // Connection for non transactional query's
    const dbClient = await req.getDbClient();

    // Check email existance
    const checkExistance = await dbClient.selectOne(`SELECT id FROM users WHERE email = :email`, { email: data.email });
    if (checkExistance) {
        return badRequest(req, res, next, `User with this email already exists`, 123); // 123 is a error code for some client logic
    }

    dbClient.add('email', data.email);
    await dbClient.insert('users');

    amqpSendEmail({
        to: data.email,
        subject: 'Registration',
        html: '<b>Thanks for registraion</b>',
        text: 'Thanks for registraion'
    });

    
    successResponse(req, res, next, {
        access_token: 'some access token or JWT token or whatever',
    });
});