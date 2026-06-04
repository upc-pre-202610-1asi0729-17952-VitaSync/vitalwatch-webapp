export class Organization {
    private _id: number;
    private _name: string;
    private _ruc: string;
    private _address: string;
    private _phone: string;

    constructor(props: {
        id: number;
        name: string;
        ruc: string;
        address: string;
        phone: string;
    }) {
        this._id = props.id;
        this._name = props.name;
        this._ruc = props.ruc;
        this._address = props.address;
        this._phone = props.phone;
    }

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get ruc(): string {
        return this._ruc;
    }

    set ruc(value: string) {
        this._ruc = value;
    }

    get address(): string {
        return this._address;
    }

    set address(value: string) {
        this._address = value;
    }

    get phone(): string {
        return this._phone;
    }

    set phone(value: string) {
        this._phone = value;
    }
}