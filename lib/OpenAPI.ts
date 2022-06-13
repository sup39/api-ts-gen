import {StrictTypeParser as STP} from './utils/StrictTypeParser';
const warn = (x: any) => console.warn('\x1b[1;33mWarning: '+x+'\x1b[0m');
type Dict<T> = {[_: string]: T};

/* ==== type declaration ==== */
export interface OpenAPI {
  paths: Paths;
  components?: Components;
}

// path
interface Paths {
  [path: string]: PathItem
}
interface PathItem {
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  patch?: Operation;
  [_: string]: any;
}
type EMethod = 'get' | 'put' | 'post' | 'delete' | 'patch';
const ELMethod: Array<EMethod> = ['get', 'put', 'post', 'delete', 'patch'];
interface Operation {
  responses: Dict<Response | Reference>;
  parameters?: Array<Parameter | Reference>;
  requestBody?: RequestBody | Reference;
  operationId?: string;
}

// response
interface Response {
  // headers?: Header;
  content?: TMediaTypes;
}
type TMediaTypes = {[contentType: string]: MediaType};
interface MediaType {
  schema?: Schema | Reference;
  example?: any;
  examples?: {[_: string]: object};
}

// parameter
interface Parameter {
  name: string;
  in: EParameterIn;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  style?: string;
  schema?: Schema | Reference;
}
type EParameterIn = 'query' | 'header' | 'path' | 'cookie';
export const ELParameterIn: Array<EParameterIn> = [
  'path', 'query', 'header', 'cookie'];

// request body
interface RequestBody {
  description: string;
  content: Dict<MediaType>;
  required?: boolean;
}

// components
interface Components {
  schemas: Dict<Schema | Reference>;
  responses: Dict<Response | Reference>;
  parameters: Dict<Parameter | Reference>;
  requestBodies: Dict<RequestBody | Reference>;
}

// schemeType
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
export function isArraySchema(x: any): x is ArraySchema {
  return x.type === 'array';
}
interface ObjectSchema extends Schema {
  properties: {[name: string]: Schema | Reference};
}
export function isObjectSchema(x: any): x is ObjectSchema {
  return x.type === 'object';
}
export interface Reference {
  $ref: string;
  maxSize?: string | number;
}
function isReference(x: any): x is Reference {
  return typeof x.$ref === 'string';
}

// api
class APIFunction {
  constructor(
    public method: string,
    public url: string,
    public reqTypes: TReqTypes,
    public resTypes: TResTypes,
  ) {}
}
type TReqTypes = {
  query?: {[name: string]: SchemaType};
  header?: {[name: string]: SchemaType};
  path?: {[name: string]: SchemaType};
  cookie?: {[name: string]: SchemaType};
  body?: SchemaType;
};
type TResTypes = {[status: string]: SchemaType};
/* ==== ==== */

// Reference
export function resolveRef<T>(
  obj: T|Reference, dict: Dict<T|Reference>|undefined, prefix: string,
): T | undefined {
  do {
    if (!isReference(obj)) return obj;
    const ref = obj.$ref;
    if (ref.startsWith(prefix)) {
      const name = ref.substring(prefix.length+1); // $prefix/
      const obj0 = dict?.[name];
      if (obj0 === undefined) {
        console.error(`ref not found: ${ref}`);
        return;
      }
      obj = obj0;
    } else {
      console.error(`Invalid ref: ${ref}, expect prefix ${prefix}`);
      return;
    }
  } while (true);
}

function mediaTypes2type(
  content?: TMediaTypes, required?: boolean,
): SchemaType {
  const media = content?.['application/json']; // TODO
  if (media == null) {
    if (Object.keys(content ?? {}).length > 0) {
      warn('only support application/json now');
    }
    return new SchemaType('any', false, false);
  }
  // schema
  const {schema} = media;
  return new SchemaType(schema ?? 'any', required ?? false, false);
}
export class SchemaType {
  private _typeName?: string;
  get typeName(): string {
    return this._typeName ??
      (this._typeName = SchemaType.typeNameOf(this.schema, this._sameFile));
  }
  get required(): boolean {
    return this._required;
  }
  get maxSize(): string | number | undefined {
    return this.schema.maxSize;
  }
  forProp(prop: string): string {
    return `${prop}${this.required ? '' : '?'}: ${this.typeName}`;
  }
  stp(
    prop: string, label: string,
    partial: boolean=false, sameFile: boolean=false,
  ): string {
    const stp = SchemaType.gcStp(prop, this.schema, label, partial, sameFile);
    return (this.required ? '' : `${prop}===void 0 ? void 0 : `)+stp;
  }

  private schema: Schema | Reference;
  constructor(
    schema: Schema | Reference | string,
    private _required: boolean,
    private _sameFile: boolean,
  ) {
    this.schema = typeof schema === 'string' ? {type: schema} : schema;
  }

  static typeNameOf(schema: Schema | Reference, sameFile: boolean): string {
    if (isReference(schema)) {
      const {$ref} = schema;
      const typeName = /^#\/components\/schemas\/(\w+)$/g.exec($ref)?.[1];
      if (typeName == null) {
        warn(`Invalid $ref, use any instead: ${$ref}`);
        return 'any';
      }
      return sameFile ? typeName : `Schemas.${typeName}`;
    }
    const {
      type, format, nullable, readOnly,
    } = schema;
    let sType = type;
    if (isArraySchema(schema)) {
      sType = `Array<${SchemaType.typeNameOf(schema.items, sameFile)}>`;
    } else if (isObjectSchema(schema)) {
      sType = '{';
      for (const [name, sub] of Object.entries(schema.properties)) {
        sType += `${name}: ${SchemaType.typeNameOf(sub, sameFile)}, `;
      }
      sType += '}';
    } else if (type === 'string') {
      if (format === 'date-time') sType = 'Date';
      else if (format === 'date') sType = 'FullDate';
      else if (format === 'byte') sType = 'string'; // TODO Buffer
      else if (format === 'binary') sType = 'string'; // TODO Buffer
      else if (format) warn(`Unknown format ${format}, use string instead`);
    } else if (type === 'integer') sType = 'number'; // TODO integer
    if (nullable) sType = `${sType} | null`;
    if (readOnly) sType = `Readonly<${sType}>`;
    return sType;
  }
  static gcStp(para: string, schema: Schema | Reference,
    label: string, partial: boolean, sameFile: boolean): string {
    // partial: Object only, 1 layer only
    // object
    if (isReference(schema)) {
      const typeName = new SchemaType(schema, true, sameFile).typeName;
      return `${typeName}.${partial ? 'Partial': 'from'}(${para})`;
    }
    // any
    const {type, nullable, format} = schema;
    let sStp;
    if (type === 'any') return para;
    if (isArraySchema(schema)) {
      sStp = `(v, l)=>STP._Array(v, l, elm=>${SchemaType.gcStp(
        'elm', schema.items, `${label}[]`, false, sameFile)})`;
    } else if (isObjectSchema(schema)) {
      sStp = '()=>({';
      for (const [name, sub] of Object.entries(schema.properties)) {
        sStp += `${name}: ${SchemaType.gcStp(
          para+'.'+name, sub, label+'.'+name, false, sameFile)}, `;
      }
      sStp += '})';
    } else {
      let t;
      if (type === 'string') {
        if (format === 'date-time') t = 'Date';
        else if (format === 'date') t = 'FullDate';
        else if (format === 'byte') t = 'byte';
        else if (format === 'binary') t = 'binary';
        else {
          if (format) {
            warn(`Unknown string format ${format}, use string instead`);
          }
          t = 'string';
        }
      } else if (type === 'integer') {
        if (format === 'int32') t = 'int32';
        else {
          if (format && format !== 'int64') {
            warn(`Unsupport integer format ${format}, use number instead`);
          }
          t = 'number'; // TODO int64
        }
      } else t = type;
      if (!STP.supportTypes.includes(t)) {
        warn(`Unsupport type ${type} ${format}, use any instead`);
        return para;
      }
      sStp = `STP._${t}`;
    }
    // nullable
    const funcName = nullable ? 'nullableParse' : 'parse';
    // result
    const sLabel = `'${label.replace(/'/g, '\\\'')}'`; // escape
    return `STP.${funcName}(${sStp}, ${para}, ${sLabel})`;
  }
}

export type APIFunctions = {[_: string]: APIFunction};
export function apiFunctionsOf(openAPI: OpenAPI): APIFunctions {
  const {paths, components: comps} = openAPI;
  const compPrefix = '#/components/';
  const functions: APIFunctions = {};
  for (const [url, pathItem] of Object.entries(paths)) {
    for (const method of ELMethod) {
      const op = pathItem[method];
      if (op == null) continue;
      // operationId
      const {
        operationId, parameters, requestBody, responses,
      } = op;
      if (operationId == null) {
        warn(`ignore operation in ${method} ${url}: ` +
          'operationId should be given');
        continue;
      }
      const name = operationId;
      const reqTypes: TReqTypes = {};
      const resTypes: TResTypes = {};
      // reqParas
      if (parameters != null) {
        for (const rPara of parameters) {
          const para = resolveRef(
            rPara, comps?.parameters, compPrefix+'parameters');
          if (para == null) continue;
          const {
            name, in: _in, required, schema,
          } = para;
          // add
          if (reqTypes[_in] == null) reqTypes[_in] = {};
          reqTypes[_in]![name] = new SchemaType(
            schema ?? 'any', required ?? false, false);
        }
      }
      // requestBody
      if (requestBody != null) {
        const requestBodyO = resolveRef(
          requestBody, comps?.requestBodies, compPrefix+'requestBodies');
        if (requestBodyO == null) continue;
        reqTypes.body = mediaTypes2type(
          requestBodyO.content,
          requestBodyO.required,
        );
      }
      // responses
      for (const [status, rRes] of Object.entries(responses)) {
        const res = resolveRef(rRes, comps?.responses, compPrefix+'responses');
        if (res == null) continue;
        resTypes[status] = mediaTypes2type(res.content, true);
      }
      // add to group
      const saf = new APIFunction(method, url, reqTypes, resTypes);
      functions[name] = saf;
    }
  }
  return functions;
}
