export type CareTeamStatus = 'ACTIVE' | 'INACTIVE';

export class CareTeam {
    private _id: number;
    private _organizationId: number;
    private _name: string;
    private _workAreaId: number;
    private _supervisorId: number | null;
    private _status: CareTeamStatus;

    constructor(props: {
        id: number;
        organizationId: number;
        name: string;
        workAreaId: number;
        supervisorId: number | null;
        status: CareTeamStatus;
    }) {
        this._id = props.id;
        this._organizationId = props.organizationId;
        this._name = props.name;
        this._workAreaId = props.workAreaId;
        this._supervisorId = props.supervisorId;
        this._status = props.status;
    }

    get id(): number {
        return this._id;
    }

    get organizationId(): number {
        return this._organizationId;
    }

    get name(): string {
        return this._name;
    }

    get workAreaId(): number {
        return this._workAreaId;
    }

    get supervisorId(): number | null {
        return this._supervisorId;
    }

    get status(): CareTeamStatus {
        return this._status;
    }

    get isActive(): boolean {
        return this._status === 'ACTIVE';
    }
}