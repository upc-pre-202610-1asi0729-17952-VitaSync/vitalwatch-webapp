import { UserRole } from './user.entity';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED';

export class Invitation {
    private _id: number;
    private _organizationId: number;
    private _email: string;
    private _role: UserRole;
    private _status: InvitationStatus;
    private _token: string;

    constructor(props: {
        id: number;
        organizationId: number;
        email: string;
        role: UserRole;
        status: InvitationStatus;
        token: string;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._email = props.email;
        this._role = props.role;
        this._status = props.status;
        this._token = props.token;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get email(): string { return this._email; }
    get role(): UserRole { return this._role; }
    get status(): InvitationStatus { return this._status; }
    get token(): string { return this._token; }

    get isPending(): boolean {
        return this._status === 'PENDING';
    }
}