export type BillingPeriod = 'monthly' | 'yearly';

export class Plan {
    private _id: number;
    private _code: string;
    private _name: string;
    private _price: number;
    private _billingPeriod: BillingPeriod;
    private _description: string;

    constructor(props: {
        id: number;
        code: string;
        name: string;
        price: number;
        billingPeriod: BillingPeriod;
        description: string;
    }) {
        this._id = props.id;
        this._code = props.code;
        this._name = props.name;
        this._price = props.price;
        this._billingPeriod = props.billingPeriod;
        this._description = props.description;
    }

    get id(): number { return this._id; }
    get code(): string { return this._code; }
    get name(): string { return this._name; }
    get price(): number { return this._price; }
    get billingPeriod(): BillingPeriod { return this._billingPeriod; }
    get description(): string { return this._description; }
}