export class TeamMember {
    private _id: number;
    private _teamId: number;
    private _userId: number;

    constructor(props: {
        id: number;
        teamId: number;
        userId: number;
    }) {
        this._id = props.id;
        this._teamId = props.teamId;
        this._userId = props.userId;
    }

    get id(): number {
        return this._id;
    }

    get teamId(): number {
        return this._teamId;
    }

    get userId(): number {
        return this._userId;
    }
}