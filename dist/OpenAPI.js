"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StrictTypeParser_1 = require("./utils/StrictTypeParser");
var warn = function (x) { return console.warn('\x1b[1;33mWarning: ' + x + '\x1b[0m'); };
var ELMethod = ['get', 'put', 'post', 'delete', 'patch'];
exports.ELParameterIn = [
    'path', 'query', 'header', 'cookie'
];
function isArraySchema(x) {
    return x.type === 'array';
}
exports.isArraySchema = isArraySchema;
function isObjectSchema(x) {
    return x.type === 'object';
}
exports.isObjectSchema = isObjectSchema;
function isReference(x) {
    return typeof x.$ref === 'string';
}
// api
var APIFunction = /** @class */ (function () {
    function APIFunction(method, url, reqTypes, resTypes) {
        this.method = method;
        this.url = url;
        this.reqTypes = reqTypes;
        this.resTypes = resTypes;
    }
    return APIFunction;
}());
/* ==== ==== */
// Reference
function resolveRef(obj, dict, prefix) {
    do {
        if (!isReference(obj))
            return obj;
        var ref = obj.$ref;
        if (ref.startsWith(prefix)) {
            var name_1 = ref.substring(prefix.length + 1); // $prefix/
            var obj0 = dict === null || dict === void 0 ? void 0 : dict[name_1];
            if (obj0 === undefined) {
                console.error("ref not found: " + ref);
                return;
            }
            obj = obj0;
        }
        else {
            console.error("Invalid ref: " + ref + ", expect prefix " + prefix);
            return;
        }
    } while (true);
}
exports.resolveRef = resolveRef;
function mediaTypes2type(content, required) {
    var media = content === null || content === void 0 ? void 0 : content['application/json']; // TODO
    if (media == null) {
        if (Object.keys(content !== null && content !== void 0 ? content : {}).length > 0) {
            warn('only support application/json now');
        }
        return new SchemaType('any', false, false);
    }
    // schema
    var schema = media.schema;
    return new SchemaType(schema !== null && schema !== void 0 ? schema : 'any', required !== null && required !== void 0 ? required : false, false);
}
var SchemaType = /** @class */ (function () {
    function SchemaType(schema, _required, _sameFile) {
        this._required = _required;
        this._sameFile = _sameFile;
        this.schema = typeof schema === 'string' ? { type: schema } : schema;
    }
    Object.defineProperty(SchemaType.prototype, "typeName", {
        get: function () {
            var _a;
            return (_a = this._typeName) !== null && _a !== void 0 ? _a : (this._typeName = SchemaType.typeNameOf(this.schema, this._sameFile));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SchemaType.prototype, "required", {
        get: function () {
            return this._required;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SchemaType.prototype, "maxSize", {
        get: function () {
            return this.schema.maxSize;
        },
        enumerable: true,
        configurable: true
    });
    SchemaType.prototype.forProp = function (prop) {
        return "" + prop + (this.required ? '' : '?') + ": " + this.typeName;
    };
    SchemaType.prototype.stp = function (prop, label, partial, sameFile) {
        if (partial === void 0) { partial = false; }
        if (sameFile === void 0) { sameFile = false; }
        var stp = SchemaType.gcStp(prop, this.schema, label, partial, sameFile);
        return (this.required ? '' : prop + "===void 0 ? void 0 : ") + stp;
    };
    SchemaType.typeNameOf = function (schema, sameFile) {
        var _a;
        if (isReference(schema)) {
            var $ref = schema.$ref;
            var typeName = (_a = /^#\/components\/schemas\/(\w+)$/g.exec($ref)) === null || _a === void 0 ? void 0 : _a[1];
            if (typeName == null) {
                warn("Invalid $ref, use any instead: " + $ref);
                return 'any';
            }
            return sameFile ? typeName : "Schemas." + typeName;
        }
        var type = schema.type, format = schema.format, nullable = schema.nullable, readOnly = schema.readOnly;
        var sType = type;
        if (isArraySchema(schema)) {
            sType = "Array<" + SchemaType.typeNameOf(schema.items, sameFile) + ">";
        }
        else if (isObjectSchema(schema)) {
            sType = '{';
            for (var _i = 0, _b = Object.entries(schema.properties); _i < _b.length; _i++) {
                var _c = _b[_i], name_2 = _c[0], sub = _c[1];
                sType += name_2 + ": " + SchemaType.typeNameOf(sub, sameFile) + ", ";
            }
            sType += '}';
        }
        else if (type === 'string') {
            if (format === 'date-time')
                sType = 'Date';
            else if (format === 'date')
                sType = 'FullDate';
            else if (format === 'byte')
                sType = 'string'; // TODO Buffer
            else if (format === 'binary')
                sType = 'string'; // TODO Buffer
            else if (format)
                warn("Unknown format " + format + ", use string instead");
        }
        else if (type === 'integer')
            sType = 'number'; // TODO integer
        if (nullable)
            sType = sType + " | null";
        if (readOnly)
            sType = "Readonly<" + sType + ">";
        return sType;
    };
    SchemaType.gcStp = function (para, schema, label, partial, sameFile) {
        // partial: Object only, 1 layer only
        // object
        if (isReference(schema)) {
            var typeName = new SchemaType(schema, true, sameFile).typeName;
            return typeName + "." + (partial ? 'Partial' : 'from') + "(" + para + ")";
        }
        // any
        var type = schema.type, nullable = schema.nullable, format = schema.format;
        var sStp;
        if (type === 'any')
            return para;
        if (isArraySchema(schema)) {
            sStp = "(v, l)=>STP._Array(v, l, elm=>" + SchemaType.gcStp('elm', schema.items, label + "[]", false, sameFile) + ")";
        }
        else if (isObjectSchema(schema)) {
            sStp = '()=>({';
            for (var _i = 0, _a = Object.entries(schema.properties); _i < _a.length; _i++) {
                var _b = _a[_i], name_3 = _b[0], sub = _b[1];
                sStp += name_3 + ": " + SchemaType.gcStp(para + '.' + name_3, sub, label + '.' + name_3, false, sameFile) + ", ";
            }
            sStp += '})';
        }
        else {
            var t = void 0;
            if (type === 'string') {
                if (format === 'date-time')
                    t = 'Date';
                else if (format === 'date')
                    t = 'FullDate';
                else if (format === 'byte')
                    t = 'byte';
                else if (format === 'binary')
                    t = 'binary';
                else {
                    if (format) {
                        warn("Unknown string format " + format + ", use string instead");
                    }
                    t = 'string';
                }
            }
            else if (type === 'integer') {
                if (format === 'int32')
                    t = 'int32';
                else {
                    if (format && format != 'int64') {
                        warn("Unsupport integer format " + format + ", use number instead");
                    }
                    t = 'number'; // TODO int64
                }
            }
            else
                t = type;
            if (!StrictTypeParser_1.StrictTypeParser.supportTypes.includes(t)) {
                warn("Unsupport type " + type + " " + format + ", use any instead");
                return para;
            }
            sStp = "STP._" + t;
        }
        // nullable
        var funcName = nullable ? 'nullableParse' : 'parse';
        // result
        var sLabel = "'" + label.replace(/'/g, '\\\'') + "'"; // escape
        return "STP." + funcName + "(" + sStp + ", " + para + ", " + sLabel + ")";
    };
    return SchemaType;
}());
exports.SchemaType = SchemaType;
function apiFunctionsOf(openAPI) {
    var paths = openAPI.paths, comps = openAPI.components;
    var compPrefix = '#/components/';
    var functions = {};
    for (var _i = 0, _a = Object.entries(paths); _i < _a.length; _i++) {
        var _b = _a[_i], url = _b[0], pathItem = _b[1];
        for (var _c = 0, ELMethod_1 = ELMethod; _c < ELMethod_1.length; _c++) {
            var method = ELMethod_1[_c];
            var op = pathItem[method];
            if (op == null)
                continue;
            // operationId
            var operationId = op.operationId, parameters = op.parameters, requestBody = op.requestBody, responses = op.responses;
            if (operationId == null) {
                warn("ignore operation in " + method + " " + url + ": " +
                    'operationId should be given');
                continue;
            }
            var name_4 = operationId;
            var reqTypes = {};
            var resTypes = {};
            // reqParas
            if (parameters != null) {
                for (var _d = 0, parameters_1 = parameters; _d < parameters_1.length; _d++) {
                    var rPara = parameters_1[_d];
                    var para = resolveRef(rPara, comps === null || comps === void 0 ? void 0 : comps.parameters, compPrefix + 'parameters');
                    if (para == null)
                        continue;
                    var name_5 = para.name, _in = para.in, required = para.required, schema = para.schema;
                    // add
                    if (reqTypes[_in] == null)
                        reqTypes[_in] = {};
                    reqTypes[_in][name_5] = new SchemaType(schema !== null && schema !== void 0 ? schema : 'any', required !== null && required !== void 0 ? required : false, false);
                }
            }
            // requestBody
            if (requestBody != null) {
                var requestBodyO = resolveRef(requestBody, comps === null || comps === void 0 ? void 0 : comps.requestBodies, compPrefix + 'requestBodies');
                if (requestBodyO == null)
                    continue;
                reqTypes.body = mediaTypes2type(requestBodyO.content, requestBodyO.required);
            }
            // responses
            for (var _e = 0, _f = Object.entries(responses); _e < _f.length; _e++) {
                var _g = _f[_e], status_1 = _g[0], rRes = _g[1];
                var res = resolveRef(rRes, comps === null || comps === void 0 ? void 0 : comps.responses, compPrefix + 'responses');
                if (res == null)
                    continue;
                resTypes[status_1] = mediaTypes2type(res.content, true);
            }
            // add to group
            var saf = new APIFunction(method, url, reqTypes, resTypes);
            functions[name_4] = saf;
        }
    }
    return functions;
}
exports.apiFunctionsOf = apiFunctionsOf;
