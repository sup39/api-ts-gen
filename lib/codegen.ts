import * as fs from 'fs';
import * as path from 'path';
import {Config, ConfigUser, configDefault} from './Config';
import {
  apiFunctionsOf, OpenAPI, APIFunctions as APIFuncs,
  ELParameterIn, SchemaType, Schemas, isObjectSchema,
} from './OpenAPI';
import {CodePrinter} from './CodePrinter';

function codegenIServerAPI(funcs: APIFuncs, config: Config, cp: CodePrinter) {
  const {apiDirTSPath, IHandlerName} = config;
  // import
  cp.writeln(`import * as IHandler from '${apiDirTSPath}/${IHandlerName}'`);
  // export default
  cp.writeln('\nexport default interface IAPI {', 1);
  for (const funcName of Object.keys(funcs)) {
    cp.writeln(
      `${funcName}: IHandler.${funcName}.IServerHandler;`,
    );
  }
  cp.writeln('};', -1);
  return cp.end();
}

function codegenIHandler(funcs: APIFuncs, config: Config, cp: CodePrinter) {
  const {
    apiDirTSPath, schemasName, utilsTSPath,
    responsePrefix, validateStatus, stateTSPath,
  } = config;
  // import
  cp.writeln(`import * as Schemas from '${apiDirTSPath}/${schemasName}'`);
  cp.writeln('import {FullDate, StrictTypeParser as STP, APIPromise} ' +
             `from '${utilsTSPath}'`);
  cp.writeln('import {RouterContext as Context} from \'@koa/router\'');
  cp.writeln('import {AxiosResponse} from \'axios\'');
  cp.writeln(stateTSPath ?
    `import IState from '${stateTSPath}'` : 'type IState = any');
  // handler types
  for (const [funcName, func] of Object.entries(funcs)) {
    const {reqTypes, resTypes, method} = func;
    cp.writeln(`export namespace ${funcName} {`, 1);
    // req
    const sReqTypes: string[] = [];
    // paras
    for (const _in of ELParameterIn) {
      const paras = reqTypes[_in];
      if (paras == null) continue;
      cp.writeln(`export type T_${_in} = {`, 1);
      for (const [propName, schemaType] of Object.entries(paras)) {
        cp.writeln(schemaType.forProp(propName)+';');
      }
      cp.writeln('};', -1);
      sReqTypes.push(`${_in}: T_${_in}`);
    }
    // body
    const {body} = reqTypes;
    if (body != null) {
      // PATCH's req body: Partial
      let {typeName} = body;
      if (method == 'patch') typeName = `Partial<${typeName}>`;
      cp.writeln(`export type T_body = ${typeName};`);
      sReqTypes.push(`body${body.required ? '' : '?'}: T_body`);
    }
    // IRequest
    if (sReqTypes.length > 0) {
      cp.writeln('interface IRequest {', 1);
      for (const sReqType of sReqTypes) cp.writeln(`${sReqType};`);
      cp.writeln('}', -1);
    } else cp.writeln('interface IRequest {}');
    // res
    cp.writeln('interface IResponses<T> {', 1);
    for (const [status, schema] of Object.entries(resTypes)) {
      cp.writeln(`${responsePrefix}${status}: ${
        `(${schema.forProp('body')}) => T;`
      }`);
    }
    cp.writeln('}', -1);
    cp.writeln('export interface IServerHandler {', 1);
    cp.writeln('(req: IRequest, res: IResponses<void>, ' +
                 'state: IState, ctx: Context): void;');
    cp.writeln('}', -1);
    // class _ResponsePromise
    const validTypes = new Set<string>();
    cp.writeln('export class ResponsePromise<T> extends ' +
               'APIPromise<T|T_ValidResponse> {', 1);
    // handler
    cp.writeln('private handlers: Partial<IResponses<T>> = {};');
    // on
    cp.writeln('on<K extends keyof IResponses<T>, U>(', 1);
    cp.writeln('k: K, h: IResponses<U>[K]): ResponsePromise<T|U>');
    cp.tab(-1);
    cp.writeln('{ const e: ResponsePromise<T|U> = this; ' +
               'e.handlers[k] = h; return e; }');
    // onResponse
    cp.writeln('onResponse(res: AxiosResponse<any>){', 1);
    cp.writeln('const {status, data} = res');
    cp.writeln('switch(status){', 1);
    for (const [status, schema] of Object.entries(resTypes)) {
      // TODO void -> string or any
      const isValid = validateStatus(status);
      cp.writeln(`case ${status}: return this.${
        isValid ? 'onSuccess' : 'onFail'
      }(this.handlers[${status}],`, 1);
      cp.writeln(`${schema.stp('data', 'res.body')});`);
      cp.tab(-1);
      if (isValid) validTypes.add(schema.typeName);
    }
    cp.writeln('}', -1); // end switch
    cp.writeln('throw new Error(\'Unexpect status code: \'+status);');
    cp.writeln('}', -1); // end onResponse
    cp.writeln('}', -1); // end class
    // valid type
    const sValidTypes = Array.from(validTypes.values()).join(' | ');
    cp.writeln(`export type T_ValidResponse = ${sValidTypes};`);
    // export client handler
    cp.writeln('export interface IClientHandler {', 1);
    cp.writeln(`(${sReqTypes.join(', ')}): ResponsePromise<never>;`);
    cp.writeln('}', -1); // end client handler
    cp.writeln('}', -1); // end namespace
  }
  return cp.end();
}
function codegenRouter(funcs: APIFuncs, config: Config, cp: CodePrinter) {
  const {
    apiDirTSPath, schemasName, responsePrefix,
    ServerAPITSPath, utilsTSPath, stateTSPath,
  } = config;
  // import
  cp.writeln(`import * as Schemas from '${apiDirTSPath}/${schemasName}'`);
  cp.writeln(`import * as Router from '@koa/router'`);
  cp.writeln(
    `import {FullDate, StrictTypeParser as STP} from '${utilsTSPath}'`);
  cp.writeln(`import * as bodyParser from 'koa-body'`);
  cp.writeln(stateTSPath ?
    `import IState from '${stateTSPath}'` : 'type IState = any');
  cp.writeln(`type CTX = Router.RouterContext<IState>;`);
  // router
  cp.writeln(`\nconst router = new Router<IState>();`);
  cp.writeln('');
  // function
  cp.writeln('function isEmpty(x: any): boolean {', 1);
  cp.writeln('if(x == null || x === \'\') return true;');
  cp.writeln('if(typeof x === \'object\') return Object.keys(x).length===0');
  cp.writeln('return false;');
  cp.writeln('}', -1);
  cp.writeln('function nullableParse<T>(v: any, ' +
               'p: (x: any)=>T): T | undefined {', 1);
  cp.writeln('return isEmpty(v) ? undefined : p(v);');
  cp.writeln('}', -1);
  cp.writeln('const ctxGetParas = {', 1);
  cp.writeln('path: (ctx: CTX, attr: string) => ctx.params[attr],');
  cp.writeln('query: (ctx: CTX, attr: string) => ctx.query[attr],');
  cp.writeln('header: (ctx: CTX, attr: string) => ctx.headers[attr],');
  cp.writeln('cookie: (ctx: CTX, attr: string) => ctx.cookies.get(attr),');
  cp.writeln('};', -1);
  // response generator
  cp.writeln('function g_res<T>(ctx: CTX, ' +
             'status: number, dft: string = \'\'){', 1);
  cp.writeln('return (body: T) => {', 1);
  cp.writeln('ctx.status = status;');
  cp.writeln('ctx.body = body ?? dft;');
  cp.writeln('}', -1);
  cp.writeln('}', -1);
  // route
  cp.writeln(`\nimport api from '${ServerAPITSPath}'`);
  for (const [funcName, func] of Object.entries(funcs)) {
    const {
      method, url, reqTypes, resTypes,
    } = func;
    const isPartial = method === 'patch';
    const statuses = Object.keys(resTypes);
    // TODO escape
    const sURL = url.replace(/{(.*?)}/g, ':$1'); // {a} -> :a
    let mid = '';
    if (reqTypes.body) {
      const {maxSize} = reqTypes.body;
      const config = maxSize == null ? '' : `{jsonLimit: '${maxSize}'}`;
      mid = `bodyParser(${config}), `;
    }
    cp.writeln(`router.${method}('${sURL}', ${mid}async ctx => {`, 1);
    // req
    if (Object.keys(reqTypes).length === 0) {
      cp.writeln('const req = {};');
    } else {
      cp.writeln('let req;');
      cp.writeln('const {body: reqBody} = ctx.request;');
      cp.writeln('try { req = {', 1);
      // paras
      for (const _in of ELParameterIn) {
        const paras = reqTypes[_in];
        if (paras == null) continue;
        cp.writeln(`${_in}: {`, 1);
        for (const [name, schema] of Object.entries(paras)) {
          const pn = `ctxGetParas.${_in}(ctx, '${name}')`;
          const label = `req.${_in}`;
          cp.writeln(`${name}: ${schema.stp(pn, label)},`);
        }
        cp.writeln('},', -1);
      }
      // body
      const {body} = reqTypes;
      if (body != null) {
        cp.writeln(`body: ${body.stp('reqBody', 'req.body', isPartial)}`);
      }
      cp.writeln('}} catch(err) {', -1); cp.tab(1);
      cp.writeln('if(err instanceof STP.BadValueError)', 1);
      cp.writeln('return ctx.throw(400, err.toString());'); cp.tab(-1);
      cp.writeln('throw err;');
      cp.writeln('}', -1);
    }
    // res
    cp.writeln('const res = {', 1);
    for (const status of statuses) {
      cp.writeln(`${responsePrefix}${status}: g_res(ctx, ${status}),`);
    }
    cp.writeln('};', -1);
    // call
    cp.writeln(`await api.${funcName}(req, res, ctx.state, ctx);`);
    cp.writeln('})', -1);
  }
  cp.writeln('\nexport default router;');
  return cp.end();
}

function codegenIClientAPI(funcs: APIFuncs, config: Config, cp: CodePrinter) {
  const {apiDirTSPath, IHandlerName} = config;
  // import
  cp.writeln(`import * as IHandler from '${apiDirTSPath}/${IHandlerName}'`);
  // export default
  cp.writeln('\nexport default interface IAPI {', 1);
  cp.writeln('$baseURL: string;');
  for (const funcName of Object.keys(funcs)) {
    cp.writeln(
      `${funcName}: IHandler.${funcName}.IClientHandler;`,
    );
  }
  cp.writeln('}', -1);
  return cp.end();
}

function codegenClientAPI(funcs: APIFuncs, config: Config, cp: CodePrinter) {
  const {
    apiDirTSPath, IClientAPIName, IHandlerName,
  } = config;
  // import
  cp.writeln(`import * as _IAPI from '${apiDirTSPath}/${IClientAPIName}'`);
  cp.writeln(`import IAPI from '${apiDirTSPath}/${IClientAPIName}'`);
  cp.writeln(`import * as IHandler from '${apiDirTSPath}/${IHandlerName}'`);
  cp.writeln('import axios from \'axios\'');
  // axios
  cp.writeln('\nconst $http = axios.create({', 1);
  cp.writeln('validateStatus: ()=>true,');
  cp.writeln('});', -1);
  // function
  cp.writeln('\nfunction urlReplacer(url: string, ' +
             'rules: {[_: string]: any}): string {', 1);
  cp.writeln('for(const [attr, value] of Object.entries(rules))', 1);
  cp.writeln('url = url.replace(\'{\'+attr+\'}\', value)');
  cp.writeln('return url;', -1);
  cp.writeln('};', -1);
  // implementation
  // export default
  cp.writeln('\nexport default {', 1);
  // set $baseURL
  cp.writeln('set $baseURL(url: string) {', 1);
  cp.writeln('$http.interceptors.request.use(async config => {', 1);
  cp.writeln('config.baseURL = url;');
  cp.writeln('return config;', -1);
  cp.writeln('}, err => Promise.reject(err));', -1);
  cp.writeln('},');
  // functions
  for (const [funcName, func] of Object.entries(funcs)) {
    const ncHandler = `IHandler.${funcName}`;
    const {method, url, reqTypes} = func;
    const {
      query, header, path, body,
    } = reqTypes; // TODO cookie
    // name
    cp.writeln(`${funcName}(`, 1);
    // paras
    for (const _in of ELParameterIn) {
      const paras = reqTypes[_in];
      if (paras == null) continue;
      let _required = false;
      for (const {required} of Object.values(paras)) {
        if (required) {
          _required = true; break;
        }
      }
      cp.writeln(`${_in}: ${ncHandler}.T_${_in}${_required ? '' : '={}'},`);
    }
    // body
    if (body != null) {
      cp.writeln(`body${body.required ? '' : '?'}: ${ncHandler}.T_body,`);
    }
    // function body
    cp.tab(-1);
    cp.writeln(`){return new ${ncHandler}`+
      '.ResponsePromise<never>($http({', 1);
    cp.writeln(`method: '${method}',`);
    const sURL = `'${url}'`;
    cp.writeln(`url: ${path ? `urlReplacer(${sURL}, path)` : sURL},`);
    if (query) cp.writeln('params: query,');
    if (header) cp.writeln('header: header,');
    if (body != null) cp.writeln('data: body,');
    cp.writeln('}));},', -1);
  }
  cp.writeln('} as IAPI', -1);
  return cp.end();
}

function codegenSchemas(schemas: Schemas, config: Config, cp: CodePrinter) {
  const {utilsTSPath} = config;
  // import
  cp.writeln(
    `import {FullDate, StrictTypeParser as STP} from '${utilsTSPath}'`);
  cp.writeln();
  // schema
  for (const [typeName, schema] of Object.entries(schemas)) {
    if (isObjectSchema(schema)) {
      cp.writeln(`export class ${typeName} {`, 1);
      const propTypes: [string, SchemaType][] = [];
      for (const [propName, prop] of Object.entries(schema.properties)) {
        const propType = new SchemaType(prop, true); // TODO required
        propTypes.push([propName, propType]);
        cp.writeln(propType.forProp(propName)+';');
      }
      // method
      cp.writeln('constructor(o: {[_: string]: any}){', 1);
      for (const [n, t] of propTypes) {
        cp.writeln(`this.${n} = ${t.stp(`o.${n}`, typeName+'.'+n)};`);
      }
      cp.writeln('}', -1);
      // Partial
      cp.writeln(
        `static Partial(o: {[_: string]: any}): Partial<${typeName}> {`, 1);
      cp.writeln(`const r: Partial<${typeName}> = {};`);
      const locPartial = `Partial<${typeName}>`;
      for (const [n, t] of propTypes) {
        cp.writeln(`if (o.${n} !== undefined) r.${n} = ${
          t.stp(`o.${n}`, locPartial+'.'+n)};`);
      }
      cp.writeln('return r;');
      cp.writeln('}', -1);
      // end of class
      cp.writeln('}', -1);
    } else {
      cp.writeln(`export type ${typeName} = ${SchemaType.typeNameOf(schema)}`);
    }
  }
  // return
  return cp.end();
}

export default function codegen(openAPI: OpenAPI, configUser: ConfigUser) {
  const config: Config = Object.assign({}, configUser, configDefault);
  // prepare
  fs.mkdirSync(config.outputDir, {recursive: true});
  const apiFuncs = apiFunctionsOf(openAPI);
  const gCP = (fn: string) => new CodePrinter(
    fs.createWriteStream(path.join(config.outputDir, fn+'.ts')),
    config.indentString,
  );
  const ps: Promise<any>[] = [];
  // write files
  // handler
  ps.push(codegenIHandler(apiFuncs, config, gCP(config.IHandlerName)));
  // server
  ps.push(codegenIServerAPI(apiFuncs, config, gCP(config.IServerAPIName)));
  ps.push(codegenRouter(apiFuncs, config, gCP(config.routerName)));
  // client
  ps.push(codegenIClientAPI(apiFuncs, config, gCP(config.IClientAPIName)));
  ps.push(codegenClientAPI(apiFuncs, config, gCP(config.ClientAPIName)));
  // schema
  const schemas = openAPI.components?.schemas;
  if (schemas != null) {
    ps.push(codegenSchemas(schemas, config, gCP(config.schemasName)));
  }
  // return
  return Promise.all(ps);
}
