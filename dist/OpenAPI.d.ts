declare type Dict<T> = {
    [_: string]: T;
};
export interface OpenAPI {
    paths: Paths;
    components?: Components;
}
interface Paths {
    [path: string]: PathItem;
}
interface PathItem {
    get?: Operation;
    put?: Operation;
    post?: Operation;
    delete?: Operation;
    patch?: Operation;
    [_: string]: any;
}
interface Operation {
    responses: Dict<Response | Reference>;
    parameters?: Array<Parameter | Reference>;
    requestBody?: RequestBody | Reference;
    operationId?: string;
}
interface Response {
    content?: TMediaTypes;
}
declare type TMediaTypes = {
    [contentType: string]: MediaType;
};
interface MediaType {
    schema?: Schema | Reference;
    example?: any;
    examples?: {
        [_: string]: object;
    };
}
interface Parameter {
    name: string;
    in: EParameterIn;
    description?: string;
    required?: boolean;
    deprecated?: boolean;
    style?: string;
    schema?: Schema | Reference;
}
declare type EParameterIn = 'query' | 'header' | 'path' | 'cookie';
export declare const ELParameterIn: Array<EParameterIn>;
interface RequestBody {
    description: string;
    content: Dict<MediaType>;
    required?: boolean;
}
interface Components {
    schemas: Dict<Schema | Reference>;
    responses: Dict<Response | Reference>;
    parameters: Dict<Parameter | Reference>;
    requestBodies: Dict<RequestBody | Reference>;
}
export interface Schema {
    type: string;
    format?: string;
    nullable?: boolean;
    readOnly?: boolean;
    maxSize?: number;
    required?: string[];
}
interface ArraySchema extends Schema {
    items: Schema | Reference;
}
export declare function isArraySchema(x: any): x is ArraySchema;
interface ObjectSchema extends Schema {
    properties: {
        [name: string]: Schema | Reference;
    };
}
export declare function isObjectSchema(x: any): x is ObjectSchema;
export interface Reference {
    $ref: string;
    maxSize?: string | number;
}
declare class APIFunction {
    method: string;
    url: string;
    reqTypes: TReqTypes;
    resTypes: TResTypes;
    constructor(method: string, url: string, reqTypes: TReqTypes, resTypes: TResTypes);
}
declare type TReqTypes = {
    query?: {
        [name: string]: SchemaType;
    };
    header?: {
        [name: string]: SchemaType;
    };
    path?: {
        [name: string]: SchemaType;
    };
    cookie?: {
        [name: string]: SchemaType;
    };
    body?: SchemaType;
};
declare type TResTypes = {
    [status: string]: SchemaType;
};
export declare function resolveRef<T>(obj: T | Reference, dict: Dict<T | Reference> | undefined, prefix: string): T | undefined;
export declare class SchemaType {
    private _required;
    private _sameFile;
    private _typeName?;
    get typeName(): string;
    get required(): boolean;
    get maxSize(): string | number | undefined;
    forProp(prop: string): string;
    stp(prop: string, label: string, partial?: boolean, sameFile?: boolean): string;
    private schema;
    constructor(schema: Schema | Reference | string, _required: boolean, _sameFile: boolean);
    static typeNameOf(schema: Schema | Reference, sameFile: boolean): string;
    static gcStp(para: string, schema: Schema | Reference, label: string, partial: boolean, sameFile: boolean): string;
}
export declare type APIFunctions = {
    [_: string]: APIFunction;
};
export declare function apiFunctionsOf(openAPI: OpenAPI): APIFunctions;
export {};
