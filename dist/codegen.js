"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var Config_1 = require("./Config");
var OpenAPI_1 = require("./OpenAPI");
var CodePrinter_1 = require("./CodePrinter");
function codegenIServerAPI(funcs, config, cp) {
    var apiDirTSPath = config.apiDirTSPath, IHandlerName = config.IHandlerName;
    // import
    cp.writeln("import * as IHandler from '" + apiDirTSPath + "/" + IHandlerName + "'");
    // export default
    cp.writeln('\nexport default interface IAPI {', 1);
    for (var _i = 0, _a = Object.keys(funcs); _i < _a.length; _i++) {
        var funcName = _a[_i];
        cp.writeln(funcName + ": IHandler." + funcName + ".IServerHandler;");
    }
    cp.writeln('};', -1);
    return cp.end();
}
function codegenIHandler(funcs, config, cp) {
    var apiDirTSPath = config.apiDirTSPath, schemasName = config.schemasName, utilsTSPath = config.utilsTSPath, responsePrefix = config.responsePrefix, validateStatus = config.validateStatus, stateTSPath = config.stateTSPath;
    // import
    cp.writeln("import * as Schemas from '" + apiDirTSPath + "/" + schemasName + "'");
    cp.writeln('import {FullDate, StrictTypeParser as STP, APIPromise} ' +
        ("from '" + utilsTSPath + "'"));
    cp.writeln('import {RouterContext as Context} from \'@koa/router\'');
    cp.writeln('import {AxiosResponse} from \'axios\'');
    cp.writeln(stateTSPath ?
        "import IState from '" + stateTSPath + "'" : 'type IState = any');
    // handler types
    for (var _i = 0, _a = Object.entries(funcs); _i < _a.length; _i++) {
        var _b = _a[_i], funcName = _b[0], func = _b[1];
        var reqTypes = func.reqTypes, resTypes = func.resTypes, method = func.method;
        cp.writeln("export namespace " + funcName + " {", 1);
        // req
        var sReqTypes = [];
        // paras
        for (var _c = 0, ELParameterIn_1 = OpenAPI_1.ELParameterIn; _c < ELParameterIn_1.length; _c++) {
            var _in = ELParameterIn_1[_c];
            var paras = reqTypes[_in];
            if (paras == null)
                continue;
            cp.writeln("export type T_" + _in + " = {", 1);
            for (var _d = 0, _e = Object.entries(paras); _d < _e.length; _d++) {
                var _f = _e[_d], propName = _f[0], schemaType = _f[1];
                cp.writeln(schemaType.forProp(propName) + ';');
            }
            cp.writeln('};', -1);
            sReqTypes.push(_in + ": T_" + _in);
        }
        // body
        var body = reqTypes.body;
        if (body != null) {
            // PATCH's req body: Partial
            var typeName = body.typeName;
            if (method == 'patch')
                typeName = "Partial<" + typeName + ">";
            cp.writeln("export type T_body = " + typeName + ";");
            sReqTypes.push("body" + (body.required ? '' : '?') + ": T_body");
        }
        // IRequest
        if (sReqTypes.length > 0) {
            cp.writeln('interface IRequest {', 1);
            for (var _g = 0, sReqTypes_1 = sReqTypes; _g < sReqTypes_1.length; _g++) {
                var sReqType = sReqTypes_1[_g];
                cp.writeln(sReqType + ";");
            }
            cp.writeln('}', -1);
        }
        else
            cp.writeln('interface IRequest {}');
        // res
        cp.writeln('interface IResponses<T> {', 1);
        for (var _h = 0, _j = Object.entries(resTypes); _h < _j.length; _h++) {
            var _k = _j[_h], status_1 = _k[0], schema = _k[1];
            cp.writeln("" + responsePrefix + status_1 + ": " + ("(" + schema.forProp('body') + ") => T;"));
        }
        cp.writeln('}', -1);
        cp.writeln('export interface IServerHandler {', 1);
        cp.writeln('(req: IRequest, res: IResponses<void>, ' +
            'state: IState, ctx: Context): void;');
        cp.writeln('}', -1);
        // class _ResponsePromise
        var validTypes = new Set();
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
        for (var _l = 0, _m = Object.entries(resTypes); _l < _m.length; _l++) {
            var _o = _m[_l], status_2 = _o[0], schema = _o[1];
            // TODO void -> string or any
            var isValid = validateStatus(status_2);
            cp.writeln("case " + status_2 + ": return this." + (isValid ? 'onSuccess' : 'onFail') + "(this.handlers[" + status_2 + "],", 1);
            cp.writeln(schema.stp('data') + ");");
            cp.tab(-1);
            if (isValid)
                validTypes.add(schema.typeName);
        }
        cp.writeln('}', -1); // end switch
        cp.writeln('throw new Error(\'Unexpect status code: \'+status);');
        cp.writeln('}', -1); // end onResponse
        cp.writeln('}', -1); // end class
        // valid type
        var sValidTypes = Array.from(validTypes.values()).join(' | ');
        cp.writeln("export type T_ValidResponse = " + sValidTypes + ";");
        // export client handler
        cp.writeln('export interface IClientHandler {', 1);
        cp.writeln("(" + sReqTypes.join(', ') + "): ResponsePromise<never>;");
        cp.writeln('}', -1); // end client handler
        cp.writeln('}', -1); // end namespace
    }
    return cp.end();
}
function codegenRouter(funcs, config, cp) {
    var apiDirTSPath = config.apiDirTSPath, schemasName = config.schemasName, responsePrefix = config.responsePrefix, ServerAPITSPath = config.ServerAPITSPath, utilsTSPath = config.utilsTSPath, stateTSPath = config.stateTSPath;
    // import
    cp.writeln("import * as Schemas from '" + apiDirTSPath + "/" + schemasName + "'");
    cp.writeln("import * as Router from '@koa/router'");
    cp.writeln("import {FullDate, StrictTypeParser as STP} from '" + utilsTSPath + "'");
    cp.writeln("import * as bodyParser from 'koa-body'");
    cp.writeln(stateTSPath ?
        "import IState from '" + stateTSPath + "'" : 'type IState = any');
    cp.writeln("type CTX = Router.RouterContext<IState>;");
    // router
    cp.writeln("\nconst router = new Router<IState>();");
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
    cp.writeln("\nimport api from '" + ServerAPITSPath + "'");
    for (var _i = 0, _a = Object.entries(funcs); _i < _a.length; _i++) {
        var _b = _a[_i], funcName = _b[0], func = _b[1];
        var method = func.method, url = func.url, reqTypes = func.reqTypes, resTypes = func.resTypes;
        var statuses = Object.keys(resTypes);
        // TODO escape
        var sURL = url.replace(/{(.*?)}/g, ':$1'); // {a} -> :a
        var mid = '';
        if (reqTypes.body) {
            var maxSize = reqTypes.body.maxSize;
            var config_1 = maxSize == null ? '' : "{jsonLimit: '" + maxSize + "'}";
            mid = "bodyParser(" + config_1 + "), ";
        }
        cp.writeln("router." + method + "('" + sURL + "', " + mid + "async ctx => {", 1);
        // TODO permission check, etc
        if (Object.keys(reqTypes).length === 0) {
            cp.writeln('const req = {};');
        }
        else {
            cp.writeln('let req;');
            cp.writeln('const {body: reqBody} = ctx.request;');
            cp.writeln('try { req = {', 1);
            // paras
            for (var _c = 0, ELParameterIn_2 = OpenAPI_1.ELParameterIn; _c < ELParameterIn_2.length; _c++) {
                var _in = ELParameterIn_2[_c];
                var paras = reqTypes[_in];
                if (paras == null)
                    continue;
                cp.writeln(_in + ": {", 1);
                for (var _d = 0, _e = Object.entries(paras); _d < _e.length; _d++) {
                    var _f = _e[_d], name_1 = _f[0], schema = _f[1];
                    var pn = "ctxGetParas." + _in + "(ctx, '" + name_1 + "')";
                    cp.writeln(name_1 + ": " + schema.stp(pn) + ",");
                }
                cp.writeln('},', -1);
            }
            // body
            var body = reqTypes.body;
            if (body != null) {
                var name_2 = 'body';
                var pn = 'reqBody';
                cp.writeln(name_2 + ": " + body.stp(pn));
            }
            cp.writeln('}} catch(err) {', -1);
            cp.tab(1);
            cp.writeln('if(err instanceof STP.BadValueError)', 1);
            cp.writeln('return ctx.throw(400, err.toString());');
            cp.tab(-1);
            cp.writeln('throw err;');
            cp.writeln('}', -1);
        }
        // res
        cp.writeln('const res = {', 1);
        for (var _g = 0, statuses_1 = statuses; _g < statuses_1.length; _g++) {
            var status_3 = statuses_1[_g];
            cp.writeln("" + responsePrefix + status_3 + ": g_res(ctx, " + status_3 + "),");
        }
        cp.writeln('};', -1);
        // call
        cp.writeln("await api." + funcName + "(req, res, ctx.state, ctx);");
        cp.writeln('})', -1);
    }
    cp.writeln('\nexport default router;');
    return cp.end();
}
function codegenIClientAPI(funcs, config, cp) {
    var apiDirTSPath = config.apiDirTSPath, IHandlerName = config.IHandlerName;
    // import
    cp.writeln("import * as IHandler from '" + apiDirTSPath + "/" + IHandlerName + "'");
    // export default
    cp.writeln('\nexport default interface IAPI {', 1);
    cp.writeln('$baseURL: string;');
    for (var _i = 0, _a = Object.keys(funcs); _i < _a.length; _i++) {
        var funcName = _a[_i];
        cp.writeln(funcName + ": IHandler." + funcName + ".IClientHandler;");
    }
    cp.writeln('}', -1);
    return cp.end();
}
function codegenClientAPI(funcs, config, cp) {
    var apiDirTSPath = config.apiDirTSPath, IClientAPIName = config.IClientAPIName, IHandlerName = config.IHandlerName;
    // import
    cp.writeln("import * as _IAPI from '" + apiDirTSPath + "/" + IClientAPIName + "'");
    cp.writeln("import IAPI from '" + apiDirTSPath + "/" + IClientAPIName + "'");
    cp.writeln("import * as IHandler from '" + apiDirTSPath + "/" + IHandlerName + "'");
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
    for (var _i = 0, _a = Object.entries(funcs); _i < _a.length; _i++) {
        var _b = _a[_i], funcName = _b[0], func = _b[1];
        var ncHandler = "IHandler." + funcName;
        var method = func.method, url = func.url, reqTypes = func.reqTypes;
        var query = reqTypes.query, header = reqTypes.header, path_1 = reqTypes.path, body = reqTypes.body; // TODO cookie
        // name
        cp.writeln(funcName + "(", 1);
        // paras
        for (var _c = 0, ELParameterIn_3 = OpenAPI_1.ELParameterIn; _c < ELParameterIn_3.length; _c++) {
            var _in = ELParameterIn_3[_c];
            var paras = reqTypes[_in];
            if (paras == null)
                continue;
            var _required = false;
            for (var _d = 0, _e = Object.values(paras); _d < _e.length; _d++) {
                var required = _e[_d].required;
                if (required) {
                    _required = true;
                    break;
                }
            }
            cp.writeln(_in + ": " + ncHandler + ".T_" + _in + (_required ? '' : '={}') + ",");
        }
        // body
        if (body != null) {
            cp.writeln("body" + (body.required ? '' : '?') + ": " + ncHandler + ".T_body,");
        }
        // function body
        cp.tab(-1);
        cp.writeln("){return new " + ncHandler +
            '.ResponsePromise<never>($http({', 1);
        cp.writeln("method: '" + method + "',");
        var sURL = "'" + url + "'";
        cp.writeln("url: " + (path_1 ? "urlReplacer(" + sURL + ", path)" : sURL) + ",");
        if (query)
            cp.writeln('params: query,');
        if (header)
            cp.writeln('header: header,');
        if (body != null)
            cp.writeln('data: body,');
        cp.writeln('}));},', -1);
    }
    cp.writeln('} as IAPI', -1);
    return cp.end();
}
function codegenSchemas(schemas, config, cp) {
    var utilsTSPath = config.utilsTSPath;
    // import
    cp.writeln("import {FullDate, StrictTypeParser as STP} from '" + utilsTSPath + "'");
    cp.writeln();
    // schema
    for (var _i = 0, _a = Object.entries(schemas); _i < _a.length; _i++) {
        var _b = _a[_i], name_3 = _b[0], schema = _b[1];
        if (OpenAPI_1.isObjectSchema(schema)) {
            cp.writeln("export class " + name_3 + " {", 1);
            var propTypes = [];
            for (var _c = 0, _d = Object.entries(schema.properties); _c < _d.length; _c++) {
                var _e = _d[_c], propName = _e[0], prop = _e[1];
                var propType = new OpenAPI_1.SchemaType(prop, true); // TODO required?
                propTypes.push([propName, propType]);
                cp.writeln(propType.forProp(propName) + ';');
            }
            // method
            cp.writeln('constructor(o: {[_: string]: any}){', 1);
            for (var _f = 0, propTypes_1 = propTypes; _f < propTypes_1.length; _f++) {
                var _g = propTypes_1[_f], n = _g[0], t = _g[1];
                cp.writeln("this." + n + " = " + t.stp("o." + n) + ";");
            }
            cp.writeln('}', -1);
            cp.writeln('}', -1);
        }
        else {
            cp.writeln("export type " + name_3 + " = " + OpenAPI_1.SchemaType.typeNameOf(schema));
        }
    }
    // return
    return cp.end();
}
function codegen(openAPI, configUser) {
    var _a;
    var config = Object.assign({}, configUser, Config_1.configDefault);
    // prepare
    fs.mkdirSync(config.outputDir, { recursive: true });
    var apiFuncs = OpenAPI_1.apiFunctionsOf(openAPI);
    var gCP = function (fn) { return new CodePrinter_1.CodePrinter(fs.createWriteStream(path.join(config.outputDir, fn + '.ts')), config.indentString); };
    var ps = [];
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
    var schemas = (_a = openAPI.components) === null || _a === void 0 ? void 0 : _a.schemas;
    if (schemas != null) {
        ps.push(codegenSchemas(schemas, config, gCP(config.schemasName)));
    }
    // return
    return Promise.all(ps);
}
exports.default = codegen;
