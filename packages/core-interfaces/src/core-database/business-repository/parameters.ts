export interface IParameters {
    offset?: number;
    limit?: number;
    orderBy?: string;
    address?: any;
    [key: string]: object | number | string | boolean;
}
