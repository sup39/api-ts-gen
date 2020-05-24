import * as fs from 'fs';
import * as path from 'path';
import {Config, ConfigUser, configDefault} from './Config';
import {
  apiFunctionsOf, OpenAPI, APIFunctions as APIFuncs,
  ELParameterIn, SchemaType, Schema, isObjectSchema, Reference, resolveRef,
} from './OpenAPI';
import {CodePrinter} from './CodePrinter';
type Dict<T> = {[_: string]: T};

function codegenIHandler(funcs: APIFuncs, config: Config, cp: CodePrinter) {
  const {
    schemasName, utilsTSPath, clientOnly,
  } = config;
  // import
  cp.writeln(`import * as Schemas from './${schemasName}'`);
  cp.writeln('import {FullDate, StrictTypeParser as STP, APIPromise} ' +
             `from '${utilsTSPath}'`);
  if (!clientOnly) {
    cp.writeln('import {RouterContext as CTX} from \'@koa/router\'');
  }
  cp.writeln('import {AxiosResponse} from \'axios\'');
  // api req, res types
  cp.writeln(`export type TAPI = {`, 1);
  for (const [funcName, func] of Object.entries(funcs)) {
    const {reqTypes, resTypes, method} = func;
    cp.writeln(`${funcName}: {`, 1);
    // req
    // req.path, ...
    cp.writeln(`req: {`, 1);
    for (const _in of ELParameterIn) {
      const paras = reqTypes[_in];
      if (paras == null) continue;
      cp.writeln(`${_in}: {`, 1);
      for (const [propName, schemaType] of Object.entries(paras)) {
        cp.writeln(schemaType.forProp(propName)+';');
      }
      cp.writeln('};', -1);
    }
    // body
    const {body} = reqTypes;
    if (body != null) {
      // PATCH's req body: Partial
      let {typeName} = body;
      if (method == 'patch') typeName = `Partial<${typeName}>`;
      cp.writeln(`body${body.required ? '' : '?'}: ${typeName};`);
    }
    cp.writeln('}', -1); // req END
    // res
    cp.writeln(`res: {`, 1);
    for (const [status, schema] of Object.entries(resTypes)) {
      cp.writeln(schema.required ?
        `${schema.forProp(status)};`: `${status}: void;`);
    }
    cp.writeln('}', -1); // res END
    // operation END
    cp.writeln('}', -1);
  }
  // TAPI END
  cp.writeln('}', -1);
  // export IServerAPI
  if (!clientOnly) {
    cp.writeln('');
    cp.writeln('type ValueOf<T> = T[keyof T];');
    cp.writeln('type RServerAPI<T> = ValueOf<', 1);
    cp.writeln('{[K in keyof T]: T[K] extends void ? [K, any?] : [K, T[K]]}>;',
      -1, false);
    cp.writeln('export type IServerAPI<IState=any> = {[K in keyof TAPI]:', 1);
    cp.writeln(`(req: TAPI[K]['req'], state: IState, ctx: CTX) =>`, 1);
    cp.writeln(`Promise<RServerAPI<TAPI[K]['res']>>}`, -2, false);
  }
  // return
  return cp.end();
}
function codegenRouter(funcs: APIFuncs, config: Config, cp: CodePrinter) {
  const {
    schemasName, IHandlerName, ServerAPITSPath, utilsTSPath,
  } = config;
  // import
  cp.writeln(`import * as Schemas from './${schemasName}'`);
  cp.writeln(`import {IServerAPI} from './${IHandlerName}'`);
  cp.writeln(`import * as Router from '@koa/router'`);
  cp.writeln(
    `import {FullDate, StrictTypeParser as STP} from '${utilsTSPath}'`);
  cp.writeln(`import * as bodyParser from 'koa-body'`);
  // api
  cp.writeln(`\nimport api from '${ServerAPITSPath}'`);
  cp.writeln(`type IState = typeof api extends IServerAPI<infer T> ? T : any;`);
  // router
  cp.writeln(`type CTX = Router.RouterContext<IState>;`);
  cp.writeln(`\nconst router = new Router<IState>();`);
  // function
  const gcGetParams = {
    path: (attr: string) => `ctx.params['${attr}']`,
    query: (attr: string) => `ctx.query['${attr}']`,
    header: (attr: string) => `ctx.headers['${attr}']`,
    cookie: (attr: string) => `ctx.cookies.get('${attr}')`,
  };
  // route
  for (const [funcName, func] of Object.entries(funcs)) {
    const {
      method, url, reqTypes,
    } = func;
    const isPartial = method === 'patch';
    // TODO escape
    const sURL = url.replace(/{(.*?)}/g, ':$1'); // {a} -> :a
    let mid = '';
    if (reqTypes.body) {
      const {maxSize} = reqTypes.body; // TODO doc
      const config = maxSize == null ? '' : `{jsonLimit: '${maxSize}'}`;
      mid = `bodyParser(${config}), `;
    }
    cp.writeln(`router.${method}('${sURL}', ${mid}async ctx => {`, 1);
    // req
    if (Object.keys(reqTypes).length === 0) {
      cp.writeln('const req = {};');
    } else {
      cp.writeln('let req;');
      cp.writeln('try {', 1);
      cp.writeln('req = {', 1);
      // paras
      for (const _in of ELParameterIn) {
        const paras = reqTypes[_in];
        if (paras == null) continue;
        cp.writeln(`${_in}: {`, 1);
        for (const [name, schema] of Object.entries(paras)) {
          const pn = gcGetParams[_in](name);
          const label = `req.${_in}`;
          cp.writeln(`${name}: ${schema.stp(pn, label)},`);
        }
        cp.writeln('},', -1);
      }
      // body
      const {body} = reqTypes;
      if (body != null) {
        cp.writeln(
          `body: ${body.stp('ctx.request.body', 'req.body', isPartial)}`);
      }
      cp.writeln('}', -1);
      cp.writeln('} catch(err) {', -1); cp.tab(1);
      cp.writeln('if (err instanceof STP.BadValueError)', 1);
      cp.writeln('return ctx.throw(400, err.toString());'); cp.tab(-1);
      cp.writeln('throw err;');
      cp.writeln('}', -1);
    }
    // call
    cp.writeln(`const r = await api.${funcName}(req, ctx.state, ctx);`);
    cp.writeln(`ctx.status = r[0];`);
    cp.writeln(`ctx.body = r[1] ?? '';`);
    // ctx END
    cp.writeln('});', -1);
  }
  cp.writeln('\nexport default router;');
  return cp.end();
}

function codegenClientAPI(funcs: APIFuncs, config: Config, cp: CodePrinter) {
  const {IHandlerName, schemasName, utilsTSPath, validateStatus} = config;
  // import
  cp.writeln(`import {TAPI} from './${IHandlerName}'`);
  cp.writeln(`import * as Schemas from './${schemasName}'`);
  cp.writeln(`import {APIPromise, StrictTypeParser as STP, ` +
    `qStringify} from '${utilsTSPath}'`);
  cp.writeln(`import axios from 'axios'`);
  cp.writeln('');
  // type
  cp.writeln(`type TSTP<T> = {[K in keyof T]: (data: any) =>`+
    `T[K] extends void ? any : T[K]};`);
  // axios
  cp.writeln('const $http = axios.create({', 1);
  cp.writeln('validateStatus: () => true,');
  cp.writeln('paramsSerializer: params => qStringify(params),');
  cp.writeln('});', -1);
  // function
  cp.writeln('\nfunction urlReplacer(url: string, ' +
             'rules: {[_: string]: any}): string {', 1);
  cp.writeln('for(const [attr, value] of Object.entries(rules))', 1);
  cp.writeln(`url = url.replace('{'+attr+'}', value)`);
  cp.writeln('return url;', -1);
  cp.writeln('};', -1);
  // implementation
  // export default
  cp.writeln('\nexport default {', 1);
  // set $baseURL
  cp.writeln('set $baseURL(url: string) {', 1);
  cp.writeln('$http.interceptors.request.use(async config => {', 1);
  cp.writeln('config.baseURL = url;');
  cp.writeln('return config;');
  cp.writeln('}, err => Promise.reject(err));', -1);
  cp.writeln('},', -1);
  // functions
  for (const [funcName, func] of Object.entries(funcs)) {
    const gcReq = (_in: string) => `TAPI['${funcName}']['req']['${_in}']`;
    const {method, url, reqTypes, resTypes} = func;
    const {
      query, header, path, body,
    } = reqTypes; // TODO cookie
    // name
    cp.writeln(`${funcName}: (`, 1);
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
      cp.writeln(`${_in}: ${gcReq(_in)}${_required ? '' : '={}'},`);
    }
    // body
    if (body != null) {
      cp.writeln(`body${body.required ? '' : '?'}: ${gcReq('body')},`);
    }
    // return value
    cp.tab(-1);
    cp.writeln(`) => APIPromise.init($http({`, 1);
    // req
    cp.writeln(`method: '${method}',`);
    const sURL = `'${url}'`;
    cp.writeln(`url: ${path ? `urlReplacer(${sURL}, path)` : sURL},`);
    if (query) cp.writeln('params: query,');
    if (header) cp.writeln('header: header,');
    if (body != null) cp.writeln('data: body,');
    cp.writeln('}), {', -1); cp.tab(1);
    // stp
    for (const [status, schema] of Object.entries(resTypes)) {
      const label = `ClientAPI[${funcName}][${status}]`;
      cp.writeln(`${status}: x => ${schema.stp('x', label)},`);
    }
    cp.writeln(`} as TSTP<TAPI['${funcName}']['res']>,`, -1);
    cp.tab(1);
    // kRsv
    cp.writeln(`[${
      Object.keys(resTypes).filter(validateStatus).join(', ')
    }]),`, -1);
  }
  cp.writeln('}', -1);
  return cp.end();
}

function codegenSchemas(
  schemas: Dict<Schema|Reference>, config: Config, cp: CodePrinter,
) {
  const {utilsTSPath} = config;
  // import
  cp.writeln(
    `import {FullDate, StrictTypeParser as STP} from '${utilsTSPath}'`);
  // schema
  for (const [typeName, rSchema] of Object.entries(schemas)) {
    const schema = resolveRef(rSchema, schemas, '#/components/schemas');
    if (schema == null) continue;
    cp.writeln();
    if (isObjectSchema(schema)) {
      // interface
      cp.writeln(`export interface ${typeName} {`, 1);
      const propTypes: [string, SchemaType][] = [];
      const requireds = new Set(schema.required ?? []);
      for (const [propName, prop] of Object.entries(schema.properties)) {
        const propType = new SchemaType(prop, requireds.has(propName));
        propTypes.push([propName, propType]);
        cp.writeln(propType.forProp(propName)+';');
      }
      cp.writeln('}', -1); // interface END
      // const
      cp.writeln(`export const ${typeName} = {`, 1);
      // .from
      cp.writeln(`from: (o: {[_: string]: any}): ${typeName} => ({`, 1);
      for (const [n, t] of propTypes) {
        cp.writeln(`${n}: ${t.stp(`o.${n}`, typeName+'.'+n)},`);
      }
      cp.writeln('}),', -1);
      // Partial
      cp.writeln(
        `Partial: (o: {[_: string]: any}): Partial<${typeName}> => {`, 1);
      cp.writeln(`const r: Partial<${typeName}> = {};`);
      const locPartial = `Partial<${typeName}>`;
      for (const [n, t] of propTypes) {
        cp.writeln(`if (o.${n} !== void 0) r.${n} = ${
          t.stp(`o.${n}`, locPartial+'.'+n)};`);
      }
      cp.writeln('return r;');
      cp.writeln('},', -1);
      // fields
      cp.writeln(`fields: [`, 1);
      cp.writeln(propTypes.map(e => `'${e[0]}',`).join(' '));
      cp.writeln(`] as Array<keyof ${typeName}>`, -1);
      // end of const
      cp.writeln('}', -1);
    } else {
      cp.writeln(`export type ${typeName} = ${SchemaType.typeNameOf(schema)}`);
    }
  }
  // return
  return cp.end();
}

export default function codegen(openAPI: OpenAPI, configUser: ConfigUser) {
  const config: Config = Object.assign({}, configDefault, configUser);
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
  if (!config.clientOnly) {
    ps.push(codegenRouter(apiFuncs, config, gCP(config.routerName)));
  }
  // client
  ps.push(codegenClientAPI(apiFuncs, config, gCP(config.ClientAPIName)));
  // schema
  const schemas = openAPI.components?.schemas;
  if (schemas != null) {
    ps.push(codegenSchemas(schemas, config, gCP(config.schemasName)));
  }
  // return
  return Promise.all(ps);
}
