"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var Config_1 = require("./Config");
var OpenAPI_1 = require("./OpenAPI");
var CodePrinter_1 = require("./CodePrinter");
function codegenIHandler(funcs, config, cp) {
    var schemasName = config.schemasName, utilsTSPath = config.utilsTSPath, clientOnly = config.clientOnly;
    // import
    cp.writeln("import * as Schemas from './" + schemasName + "'");
    cp.writeln('import {FullDate, StrictTypeParser as STP, APIPromise} ' +
        ("from '" + utilsTSPath + "'"));
    if (!clientOnly) {
        cp.writeln('import {RouterContext as CTX} from \'@koa/router\'');
    }
    cp.writeln('import {AxiosResponse} from \'axios\'');
    // api req, res types
    cp.writeln("export type TAPI = {", 1);
    for (var _i = 0, _a = Object.entries(funcs); _i < _a.length; _i++) {
        var _b = _a[_i], funcName = _b[0], func = _b[1];
        var reqTypes = func.reqTypes, resTypes = func.resTypes, method = func.method;
        cp.writeln(funcName + ": {", 1);
        // req
        // req.path, ...
        cp.writeln("req: {", 1);
        for (var _c = 0, ELParameterIn_1 = OpenAPI_1.ELParameterIn; _c < ELParameterIn_1.length; _c++) {
            var _in = ELParameterIn_1[_c];
            var paras = reqTypes[_in];
            if (paras == null)
                continue;
            cp.writeln(_in + ": {", 1);
            for (var _d = 0, _e = Object.entries(paras); _d < _e.length; _d++) {
                var _f = _e[_d], propName = _f[0], schemaType = _f[1];
                cp.writeln(schemaType.forProp(propName) + ';');
            }
            cp.writeln('};', -1);
        }
        // body
        var body = reqTypes.body;
        if (body != null) {
            // PATCH's req body: Partial
            var typeName = body.typeName;
            if (method == 'patch')
                typeName = "Partial<" + typeName + ">";
            cp.writeln("body" + (body.required ? '' : '?') + ": " + typeName + ";");
        }
        cp.writeln('}', -1); // req END
        // res
        cp.writeln("res: {", 1);
        for (var _g = 0, _h = Object.entries(resTypes); _g < _h.length; _g++) {
            var _j = _h[_g], status_1 = _j[0], schema = _j[1];
            cp.writeln(schema.required ?
                schema.forProp(status_1) + ";" : status_1 + ": void;");
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
        cp.writeln('{[K in keyof T]: T[K] extends void ? [K, any?] : [K, T[K]]}>;', -1, false);
        cp.writeln('export type IServerAPI<IState=any> = {[K in keyof TAPI]:', 1);
        cp.writeln("(req: TAPI[K]['req'], state: IState, ctx: CTX) =>", 1);
        cp.writeln("Promise<RServerAPI<TAPI[K]['res']>>}", -2, false);
    }
    // return
    return cp.end();
}
function codegenRouter(funcs, config, cp) {
    var schemasName = config.schemasName, IHandlerName = config.IHandlerName, ServerAPITSPath = config.ServerAPITSPath, utilsTSPath = config.utilsTSPath;
    // import
    cp.writeln("import * as Schemas from './" + schemasName + "'");
    cp.writeln("import {IServerAPI} from './" + IHandlerName + "'");
    cp.writeln("import * as Router from '@koa/router'");
    cp.writeln("import {FullDate, StrictTypeParser as STP} from '" + utilsTSPath + "'");
    cp.writeln("import * as bodyParser from 'koa-body'");
    // api
    cp.writeln("\nimport api from '" + ServerAPITSPath + "'");
    cp.writeln("type IState = typeof api extends IServerAPI<infer T> ? T : any;");
    // router
    cp.writeln("type CTX = Router.RouterContext<IState>;");
    cp.writeln("\nconst router = new Router<IState>();");
    // function
    var gcGetParams = {
        path: function (attr) { return "ctx.params['" + attr + "']"; },
        query: function (attr) { return "ctx.query['" + attr + "']"; },
        header: function (attr) { return "ctx.headers['" + attr + "']"; },
        cookie: function (attr) { return "ctx.cookies.get('" + attr + "')"; },
    };
    // route
    for (var _i = 0, _a = Object.entries(funcs); _i < _a.length; _i++) {
        var _b = _a[_i], funcName = _b[0], func = _b[1];
        var method = func.method, url = func.url, reqTypes = func.reqTypes;
        var isPartial = method === 'patch';
        // TODO escape
        var sURL = url.replace(/{(.*?)}/g, ':$1'); // {a} -> :a
        var mid = '';
        if (reqTypes.body) {
            var maxSize = reqTypes.body.maxSize; // TODO doc
            var config_1 = maxSize == null ? '' : "{jsonLimit: '" + maxSize + "'}";
            mid = "bodyParser(" + config_1 + "), ";
        }
        cp.writeln("router." + method + "('" + sURL + "', " + mid + "async ctx => {", 1);
        // req
        if (Object.keys(reqTypes).length === 0) {
            cp.writeln('const req = {};');
        }
        else {
            cp.writeln('let req;');
            cp.writeln('try {', 1);
            cp.writeln('req = {', 1);
            // paras
            for (var _c = 0, ELParameterIn_2 = OpenAPI_1.ELParameterIn; _c < ELParameterIn_2.length; _c++) {
                var _in = ELParameterIn_2[_c];
                var paras = reqTypes[_in];
                if (paras == null)
                    continue;
                cp.writeln(_in + ": {", 1);
                for (var _d = 0, _e = Object.entries(paras); _d < _e.length; _d++) {
                    var _f = _e[_d], name_1 = _f[0], schema = _f[1];
                    var pn = gcGetParams[_in](name_1);
                    var label = "req." + _in;
                    cp.writeln(name_1 + ": " + schema.stp(pn, label) + ",");
                }
                cp.writeln('},', -1);
            }
            // body
            var body = reqTypes.body;
            if (body != null) {
                cp.writeln("body: " + body.stp('ctx.request.body', 'req.body', isPartial));
            }
            cp.writeln('}', -1);
            cp.writeln('} catch(err) {', -1);
            cp.tab(1);
            cp.writeln('if (err instanceof STP.BadValueError)', 1);
            cp.writeln('return ctx.throw(400, err.toString());');
            cp.tab(-1);
            cp.writeln('throw err;');
            cp.writeln('}', -1);
        }
        // call
        cp.writeln("const r = await api." + funcName + "(req, ctx.state, ctx);");
        cp.writeln("ctx.status = r[0];");
        cp.writeln("ctx.body = r[1] ?? '';");
        // ctx END
        cp.writeln('});', -1);
    }
    cp.writeln('\nexport default router;');
    return cp.end();
}
function codegenClientAPI(funcs, config, cp) {
    var IHandlerName = config.IHandlerName, schemasName = config.schemasName, utilsTSPath = config.utilsTSPath, validateStatus = config.validateStatus;
    // import
    cp.writeln("import {TAPI} from './" + IHandlerName + "'");
    cp.writeln("import * as Schemas from './" + schemasName + "'");
    cp.writeln("import {APIPromise, StrictTypeParser as STP, " +
        ("qStringify} from '" + utilsTSPath + "'"));
    cp.writeln("import axios from 'axios'");
    cp.writeln('');
    // type
    cp.writeln("type TSTP<T> = {[K in keyof T]: (data: any) =>" +
        "T[K] extends void ? any : T[K]};");
    cp.writeln("export type ExID<T> = {[K in keyof T]: " +
        "'id' extends keyof T[K] ? {id: T[K]['id']} : T[K]};");
    cp.writeln();
    // axios
    cp.writeln('const $http = axios.create({', 1);
    cp.writeln('validateStatus: () => true,');
    cp.writeln('paramsSerializer: params => qStringify(params),');
    cp.writeln('});', -1);
    // function
    cp.writeln('\nfunction urlReplacer(url: string, ' +
        'rules: {[_: string]: any}): string {', 1);
    cp.writeln('for(const [attr, value] of Object.entries(rules))', 1);
    cp.writeln("url = url.replace('{'+attr+'}', value)");
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
    var _loop_1 = function (funcName, func) {
        var gcReq = function (_in) { return "TAPI['" + funcName + "']['req']['" + _in + "']"; };
        var method = func.method, url = func.url, reqTypes = func.reqTypes, resTypes = func.resTypes;
        var query = reqTypes.query, header = reqTypes.header, path_1 = reqTypes.path, body = reqTypes.body; // TODO cookie
        // name
        cp.writeln(funcName + ": (", 1);
        // paras
        for (var _i = 0, ELParameterIn_3 = OpenAPI_1.ELParameterIn; _i < ELParameterIn_3.length; _i++) {
            var _in = ELParameterIn_3[_i];
            var paras = reqTypes[_in];
            if (paras == null)
                continue;
            var _required = false;
            for (var _a = 0, _b = Object.values(paras); _a < _b.length; _a++) {
                var required = _b[_a].required;
                if (required) {
                    _required = true;
                    break;
                }
            }
            cp.writeln(_in + ": " + gcReq(_in) + (_required ? '' : '={}') + ",");
        }
        // body
        if (body != null) {
            cp.writeln("body" + (body.required ? '' : '?') + ": ExID<" + gcReq('body') + ">,");
        }
        // return value
        cp.tab(-1);
        cp.writeln(") => APIPromise.init($http({", 1);
        // req
        cp.writeln("method: '" + method + "',");
        var sURL = "'" + url + "'";
        cp.writeln("url: " + (path_1 ? "urlReplacer(" + sURL + ", path)" : sURL) + ",");
        if (query)
            cp.writeln('params: query,');
        if (header)
            cp.writeln('header: header,');
        if (body != null)
            cp.writeln('data: body,');
        cp.writeln('}), {', -1);
        cp.tab(1);
        // stp
        for (var _c = 0, _d = Object.entries(resTypes); _c < _d.length; _c++) {
            var _e = _d[_c], status_2 = _e[0], schema = _e[1];
            var label = "ClientAPI[" + funcName + "][" + status_2 + "]";
            cp.writeln(status_2 + ": x => " + schema.stp('x', label) + ",");
        }
        cp.writeln("} as TSTP<TAPI['" + funcName + "']['res']>,", -1);
        cp.tab(1);
        // kRsv
        cp.writeln("[" + Object.keys(resTypes).filter(validateStatus).join(', ') + "]),", -1);
    };
    // functions
    for (var _i = 0, _a = Object.entries(funcs); _i < _a.length; _i++) {
        var _b = _a[_i], funcName = _b[0], func = _b[1];
        _loop_1(funcName, func);
    }
    cp.writeln('}', -1);
    return cp.end();
}
function codegenSchemas(schemas, config, cp) {
    var _a;
    var utilsTSPath = config.utilsTSPath;
    // import
    cp.writeln("import {FullDate, StrictTypeParser as STP} from '" + utilsTSPath + "'");
    // schema
    for (var _i = 0, _b = Object.entries(schemas); _i < _b.length; _i++) {
        var _c = _b[_i], typeName = _c[0], rSchema = _c[1];
        var schema = OpenAPI_1.resolveRef(rSchema, schemas, '#/components/schemas');
        if (schema == null)
            continue;
        cp.writeln();
        if (OpenAPI_1.isObjectSchema(schema)) {
            // interface
            cp.writeln("export interface " + typeName + " {", 1);
            var propTypes = [];
            var requireds = new Set((_a = schema.required) !== null && _a !== void 0 ? _a : []);
            for (var _d = 0, _e = Object.entries(schema.properties); _d < _e.length; _d++) {
                var _f = _e[_d], propName = _f[0], prop = _f[1];
                var propType = new OpenAPI_1.SchemaType(prop, requireds.has(propName), true);
                propTypes.push([propName, propType]);
                cp.writeln(propType.forProp(propName) + ';');
            }
            cp.writeln('}', -1); // interface END
            // const
            cp.writeln("export const " + typeName + " = {", 1);
            // .from
            cp.writeln("from: (o: {[_: string]: any}): " + typeName + " => ({", 1);
            for (var _g = 0, propTypes_1 = propTypes; _g < propTypes_1.length; _g++) {
                var _h = propTypes_1[_g], n = _h[0], t = _h[1];
                cp.writeln(n + ": " + t.stp("o." + n, typeName + '.' + n, false, true) + ",");
            }
            cp.writeln('}),', -1);
            // Partial
            cp.writeln("Partial: (o: {[_: string]: any}): Partial<" + typeName + "> => {", 1);
            cp.writeln("const r: Partial<" + typeName + "> = {};");
            var locPartial = "Partial<" + typeName + ">";
            for (var _j = 0, propTypes_2 = propTypes; _j < propTypes_2.length; _j++) {
                var _k = propTypes_2[_j], n = _k[0], t = _k[1];
                cp.writeln("if (o." + n + " !== void 0) r." + n + " = " + t.stp("o." + n, locPartial + '.' + n, false, true) + ";");
            }
            cp.writeln('return r;');
            cp.writeln('},', -1);
            // fields
            cp.writeln("fields: [", 1);
            cp.writeln(propTypes.map(function (e) { return "'" + e[0] + "',"; }).join(' '));
            cp.writeln("] as Array<keyof " + typeName + ">", -1);
            // end of const
            cp.writeln('}', -1);
        }
        else {
            cp.writeln("export type " + typeName + " = " +
                OpenAPI_1.SchemaType.typeNameOf(schema, true));
        }
    }
    // return
    return cp.end();
}
function codegen(openAPI, configUser) {
    var _a;
    var config = Object.assign({}, Config_1.configDefault, configUser);
    // prepare
    fs.mkdirSync(config.outputDir, { recursive: true });
    var apiFuncs = OpenAPI_1.apiFunctionsOf(openAPI);
    var gCP = function (fn) { return new CodePrinter_1.CodePrinter(fs.createWriteStream(path.join(config.outputDir, fn + '.ts')), config.indentString); };
    var ps = [];
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
    var schemas = (_a = openAPI.components) === null || _a === void 0 ? void 0 : _a.schemas;
    if (schemas != null) {
        ps.push(codegenSchemas(schemas, config, gCP(config.schemasName)));
    }
    // return
    return Promise.all(ps);
}
exports.default = codegen;
