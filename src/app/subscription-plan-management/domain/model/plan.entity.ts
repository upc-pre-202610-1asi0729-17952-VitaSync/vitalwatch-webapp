export type BillingPeriod = 'monthly' | 'yearly';

export class Plan {
    private _id: number;
    private _code: string;
    private _name: string;
    private _price: number;
    private _currency: string;
    private _billingPeriod: BillingPeriod;
    private _description: string;
    private _maxDoctors: number | null;
    private _maxSupervisors: number | null;
    private _maxTeams: number | null;
    private _maxWorkAreas: number | null;
    private _monthlyInvitations: number | null;
    private _dataHistoryDays: number;
    private _supportLevel: string;
    private _recommended: boolean;
    private _featureKeys: string[];
    private _enabledModules: string[];
    private _disabledModules: string[];

    constructor(props: {
        id: number;
        code: string;
        name: string;
        price: number;
        currency?: string;
        billingPeriod: BillingPeriod;
        description?: string;
        maxDoctors?: number | null;
        maxSupervisors?: number | null;
        maxTeams?: number | null;
        maxWorkAreas?: number | null;
        monthlyInvitations?: number | null;
        dataHistoryDays?: number;
        supportLevel?: string;
        recommended?: boolean;
        featureKeys?: string[];
        enabledModules?: string[];
        disabledModules?: string[];
    }) {
        this._id = props.id;
        this._code = props.code;
        this._name = props.name;
        this._price = props.price;
        this._currency = props.currency ?? 'USD';
        this._billingPeriod = props.billingPeriod;
        this._description = props.description ?? '';
        this._maxDoctors = props.maxDoctors ?? null;
        this._maxSupervisors = props.maxSupervisors ?? null;
        this._maxTeams = props.maxTeams ?? null;
        this._maxWorkAreas = props.maxWorkAreas ?? null;
        this._monthlyInvitations = props.monthlyInvitations ?? null;
        this._dataHistoryDays = props.dataHistoryDays ?? 30;
        this._supportLevel = props.supportLevel ?? 'STANDARD';
        this._recommended = props.recommended ?? false;
        this._featureKeys = props.featureKeys ?? [];
        this._enabledModules = props.enabledModules ?? [];
        this._disabledModules = props.disabledModules ?? [];
    }

    get id(): number { return this._id; }
    get code(): string { return this._code; }
    get name(): string { return this._name; }
    get price(): number { return this._price; }
    get currency(): string { return this._currency; }
    get billingPeriod(): BillingPeriod { return this._billingPeriod; }
    get description(): string { return this._description; }
    get maxDoctors(): number | null { return this._maxDoctors; }
    get maxSupervisors(): number | null { return this._maxSupervisors; }
    get maxTeams(): number | null { return this._maxTeams; }
    get maxWorkAreas(): number | null { return this._maxWorkAreas; }
    get monthlyInvitations(): number | null { return this._monthlyInvitations; }
    get dataHistoryDays(): number { return this._dataHistoryDays; }
    get supportLevel(): string { return this._supportLevel; }
    get recommended(): boolean { return this._recommended; }
    get featureKeys(): string[] { return this._featureKeys; }
    get enabledModules(): string[] { return this._enabledModules; }
    get disabledModules(): string[] { return this._disabledModules; }

    get isEnterprise(): boolean {
        return this._code === 'enterprise';
    }
}