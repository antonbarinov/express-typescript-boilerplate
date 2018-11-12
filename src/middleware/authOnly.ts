import express from 'express';
import { unauthorized } from 'helpers/responses';
import { UserTypes } from 'typings/user';
import { asyncWrapper } from 'helpers/functions';



const authOnlyMiddleware = (accountType?: UserTypes | UserTypes[]) => asyncWrapper(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const accessToken = req.headers.authorization;
    if (!accessToken || accessToken.length != 128) return unauthorized(req, res, next);

    const dbClient = await req.getDbClient();

    
    let additionalWhere = '';
    if (accountType !== undefined) {
        let accTypes: number[] = [];
        if (typeof accountType === 'number') {
            accTypes.push(accountType);
        } else {
            accTypes = accountType;
        }

        additionalWhere = ` AND account_type IN (${accTypes.join(',')})`;
    }


    let user: any = await dbClient.selectOne(`SELECT * FROM users WHERE access_token = :accessToken ${additionalWhere}`, { accessToken, accountType });

    if (!user) return unauthorized(req, res, next);

    req.user = user;
    
    next();
});


export default authOnlyMiddleware;