export interface User {
    id: number;
    phone_number: string;
    country_code: string;
    email: string;
    name: string;
    account_type: UserTypes;
    push_token: string;
    device_platform: string;
    reg_date: string;
    access_token: string;
}

export enum UserTypes {
    Employee, // Worker
    Employer, // Director
}