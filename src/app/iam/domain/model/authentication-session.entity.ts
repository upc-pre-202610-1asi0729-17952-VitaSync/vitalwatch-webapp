import { User } from './user.entity';

export class AuthenticationSession {
    private _token: string;
    private _user: User;

    constructor(props: {
        token: string;
        user: User;
    }) {
        this._token = props.token;
        this._user = props.user;
    }

    get token(): string {
        return this._token;
    }

    get user(): User {
        return this._user;
    }
}