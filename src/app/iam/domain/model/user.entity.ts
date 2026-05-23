export type UserRole = 'HOSPITAL_ADMIN' | 'SUPERVISOR' | 'DOCTOR';

export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';

export class User {
    private _id: number;
    private _organizationId: number;
    private _firstName: string;
    private _lastName: string;
    private _email: string;
    private _role: UserRole;
    private _status: UserStatus;

    constructor(props: {
        id: number;
        organizationId: number;
        firstName: string;
        lastName: string;
        email: string;
        role: UserRole;
        status: UserStatus;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._firstName = props.firstName;
        this._lastName = props.lastName;
        this._email = props.email;
        this._role = props.role;
        this._status = props.status;
    }

    get id(): number { return this._id; }
    get organizationId(): number { return this._organizationId; }
    get firstName(): string { return this._firstName; }
    get lastName(): string { return this._lastName; }
    get email(): string { return this._email; }
    get role(): UserRole { return this._role; }
    get status(): UserStatus { return this._status; }

    get fullName(): string {
        return `${this._firstName} ${this._lastName}`;
    }

    get initials(): string {
        return `${this._firstName.charAt(0)}${this._lastName.charAt(0)}`.toUpperCase();
    }
}