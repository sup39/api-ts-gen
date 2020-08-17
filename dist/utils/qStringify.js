"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Qs0 = require("qs");
var options0 = {
    filter: function (prefix, value) {
        var _a;
        var con = value === null || value === void 0 ? void 0 : value.constructor;
        if (con === null || con === Array || con === Object)
            return value;
        if (con === Date)
            return value.toJSON();
        // use Class.toString() if defined explicitly
        return ((_a = con.prototype) === null || _a === void 0 ? void 0 : _a.hasOwnProperty('toString')) ? value.toString() : value;
    },
};
function qStringify(obj, options) {
    return Qs0.stringify(obj, Object.assign({}, options0, options));
}
exports.qStringify = qStringify;
