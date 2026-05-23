export class Plan {
    private _id: number;
    private _code: string;
    private _name: string;
    private _price: number;
    private _billingPeriod: 'monthly' | 'annual';

    constructor(props: {
        id: number;
        code: string;
        name: string;
        price: number;
        billingPeriod: 'monthly' | 'annual';
    }) {
        this._id = props.id;
        this._code = props.code;
        this._name = props.name;
        this._price = props.price;
        this._billingPeriod = props.billingPeriod;
    }

    get id(): number {
        return this._id;
    }

    set id(value: number) {
        this._id = value;
    }

    get code(): string {
        return this._code;
    }

    set code(value: string) {
        this._code = value;
    }

    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
    }

    get price(): number {
        return this._price;
    }

    set price(value: number) {
        this._price = value;
    }

    get billingPeriod(): 'monthly' | 'annual' {
        return this._billingPeriod;
    }

    set billingPeriod(value: 'monthly' | 'annual') {
        this._billingPeriod = value;
    }
}