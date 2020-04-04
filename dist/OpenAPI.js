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
function mediaTypes2type(content, required) {
    var media = content === null || content === void 0 ? void 0 : content['application/json']; // TODO
    if (media == null) {
        if (Object.keys(content !== null && content !== void 0 ? content : {}).length > 0) {
            warn('only support application/json now');
        }
        return new SchemaType('any', false);
    }
    // schema
    var schema = media.schema;
    return new SchemaType(schema !== null && schema !== void 0 ? schema : 'any', required !== null && required !== void 0 ? required : false);
}
var SchemaType = /** @class */ (function () {
    function SchemaType(schema, _required) {
        this._required = _required;
        this.schema = typeof schema === 'string' ? { type: schema } : schema;
    }
    Object.defineProperty(SchemaType.prototype, "typeName", {
        get: function () {
            var _a;
            return (_a = this._typeName) !== null && _a !== void 0 ? _a : (this._typeName = SchemaType.typeNameOf(this.schema));
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
    SchemaType.prototype.stp = function (prop) {
        var stp = SchemaType.gcStp(prop, this.schema);
        return (this.required ? '' : prop + "===undefined ? undefined : ") + stp;
    };
    SchemaType.typeNameOf = function (schema) {
        var _a;
        if (isReference(schema)) {
            var $ref = schema.$ref;
            var typeName = (_a = /^#\/components\/schemas\/(\w+)$/g.exec($ref)) === null || _a === void 0 ? void 0 : _a[1];
            if (typeName == null) {
                warn("Invalid $ref, use any instead: " + $ref);
                return 'any';
            }
            return "Schemas." + typeName;
        }
        var type = schema.type, format = schema.format, nullable = schema.nullable, readOnly = schema.readOnly;
        var sType = type;
        if (isArraySchema(schema)) {
            sType = "Array<" + SchemaType.typeNameOf(schema.items) + ">";
        }
        else if (isObjectSchema(schema)) {
            sType = '{';
            for (var _i = 0, _b = Object.entries(schema.properties); _i < _b.length; _i++) {
                var _c = _b[_i], name_1 = _c[0], sub = _c[1];
                sType += name_1 + ": " + SchemaType.typeNameOf(sub) + ", ";
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
    SchemaType.gcStp = function (para, schema) {
        var sPara = "'" + para.replace(/'/g, '\\\'') + "'";
        // object
        if (isReference(schema)) {
            return "new " + new SchemaType(schema, true).typeName + "(" + para + ")";
        }
        // any
        var code;
        var type = schema.type, nullable = schema.nullable, format = schema.format;
        if (type === 'any')
            return para;
        if (isArraySchema(schema)) {
            code = "STP._Array(" + para + ", " + sPara + ").map(o=>" + SchemaType.gcStp('o', schema.items) + ")";
        }
        else if (isObjectSchema(schema)) {
            code = '{';
            for (var _i = 0, _a = Object.entries(schema.properties); _i < _a.length; _i++) {
                var _b = _a[_i], name_2 = _b[0], sub = _b[1];
                code += name_2 + ": " + SchemaType.gcStp(para + '.' + name_2, sub) + ", ";
            }
            code += '}';
        }
        else {
            var t = void 0;
            if (type === 'string') {
                if (format === 'date-time')
                    t = 'Date';
                else if (format === 'date')
                    t = 'FullDate';
                else if (format === 'byte')
                    t = 'string'; // TODO
                else if (format === 'binary')
                    t = 'string'; // TODO
                else {
                    if (format)
                        warn("Unknown format " + format + ", use string instead");
                    t = 'string';
                }
            }
            else if (type === 'integer')
                t = 'number';
            else
                t = type;
            if (!StrictTypeParser_1.StrictTypeParser.supportTypes.includes(t)) {
                warn("Unknown type " + type + ", use any instead");
                return para;
            }
            else
                code = "STP._" + t + "(" + para + ", " + sPara + ")";
        }
        // nullable
        if (nullable)
            code = para + "===null ? null : " + code;
        return code;
    };
    return SchemaType;
}());
exports.SchemaType = SchemaType;
function apiFunctionsOf(openAPI) {
    var paths = openAPI.paths;
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
            var name_3 = operationId;
            var reqTypes = {};
            var resTypes = {};
            // reqParas
            if (parameters != null) {
                for (var _d = 0, parameters_1 = parameters; _d < parameters_1.length; _d++) {
                    var para = parameters_1[_d];
                    var name_4 = para.name, _in = para.in, required = para.required, schema = para.schema;
                    // add
                    if (reqTypes[_in] == null)
                        reqTypes[_in] = {};
                    reqTypes[_in][name_4] = new SchemaType(schema !== null && schema !== void 0 ? schema : 'any', required !== null && required !== void 0 ? required : false);
                }
            }
            // requestBody
            if (requestBody != null) {
                reqTypes.body = mediaTypes2type(requestBody.content, requestBody.required);
            }
            // responses
            for (var _e = 0, _f = Object.entries(responses); _e < _f.length; _e++) {
                var _g = _f[_e], status_1 = _g[0], res = _g[1];
                resTypes[status_1] = mediaTypes2type(res.content, true);
            }
            // add to group
            var saf = new APIFunction(method, url, reqTypes, resTypes);
            functions[name_3] = saf;
        }
    }
    return functions;
}
exports.apiFunctionsOf = apiFunctionsOf;