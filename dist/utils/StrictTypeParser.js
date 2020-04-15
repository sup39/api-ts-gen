"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var FullDate_1 = require("./FullDate");
var StrictTypeParser;
(function (StrictTypeParser) {
    var BadValueError = /** @class */ (function (_super) {
        __extends(BadValueError, _super);
        function BadValueError(label, message) {
            var _this = _super.call(this, message) || this;
            _this.label = label;
            console.error(_this.message);
            Object.setPrototypeOf(_this, BadTypeError.prototype);
            return _this;
        }
        return BadValueError;
    }(Error));
    StrictTypeParser.BadValueError = BadValueError;
    var BadTypeError = /** @class */ (function (_super) {
        __extends(BadTypeError, _super);
        function BadTypeError(label, type, value) {
            var _this = _super.call(this, label, label + ": Can not convert `" + (['object', 'array'].includes(typeof value) ?
                JSON.stringify(value) : "" + value) + "` to type " + type) || this;
            _this.label = label;
            _this.type = type;
            _this.value = value;
            return _this;
        }
        return BadTypeError;
    }(BadValueError));
    StrictTypeParser.BadTypeError = BadTypeError;
    function _int32(x, label) {
        if (typeof x === 'number' && x === (x | 0))
            return x;
        if (typeof x === 'string') { // convert from url
            var r = +x | 0;
            if (x === r.toString())
                return r;
        }
        throw new BadTypeError(label, 'int32', x);
    }
    StrictTypeParser._int32 = _int32;
    function _number(x, label) {
        if (typeof x === 'number')
            return x;
        if (typeof x === 'string') { // convert from url
            var r = +x;
            if (!isNaN(r))
                return r;
        }
        throw new BadTypeError(label, 'number', x);
    }
    StrictTypeParser._number = _number;
    function _string(x, label) {
        if (typeof x === 'string')
            return x;
        if (typeof x === 'object')
            return x.toString();
        throw new BadTypeError(label, 'string', x);
    }
    StrictTypeParser._string = _string;
    function _boolean(x, label) {
        if (typeof x === 'boolean')
            return x;
        if (typeof x === 'number')
            return x != 0;
        if (x === 'true')
            return true;
        if (x === 'false')
            return false;
        throw new BadTypeError(label, 'boolean', x);
    }
    StrictTypeParser._boolean = _boolean;
    function _Date(x, label) {
        var r = new Date(x);
        if (x != null && !isNaN(+r))
            return r;
        throw new BadTypeError(label, 'Date', x);
    }
    StrictTypeParser._Date = _Date;
    function _FullDate(x, label) {
        var r = new FullDate_1.FullDate(x);
        if (x != null && !isNaN(+r))
            return r;
        throw new BadTypeError(label, 'FullDate', x);
    }
    StrictTypeParser._FullDate = _FullDate;
    function _byte(x, label) {
        if (typeof x === 'string')
            return x;
        if (x instanceof Buffer)
            return x.toString('base64');
        throw new BadTypeError(label, 'byte', x);
    }
    StrictTypeParser._byte = _byte;
    function _binary(x, label) {
        if (typeof x === 'string')
            return x;
        if (x instanceof Buffer)
            return x.toString('hex');
        if ((x === null || x === void 0 ? void 0 : x.buffer) instanceof Buffer)
            return x.toString('hex');
        throw new BadTypeError(label, 'binary', x);
    }
    StrictTypeParser._binary = _binary;
    function _Array(x, label, mapper) {
        if (x instanceof Array)
            return x.map(mapper);
        throw new BadTypeError(label, 'Array', x);
    }
    StrictTypeParser._Array = _Array;
    function undefinedCheck(val, label) {
        if (val === undefined) {
            throw new BadValueError(label, label + " is required, but got undefined");
        }
    }
    function parse(stp, val, label) {
        // body
        undefinedCheck(val, label);
        if (val === null) {
            throw new BadValueError(label, label + " is not nullable, but got null");
        }
        return stp(val, label);
    }
    StrictTypeParser.parse = parse;
    function nullableParse(stp, val, label) {
        // body
        undefinedCheck(val, label);
        return val === null ? null : stp(val, label);
    }
    StrictTypeParser.nullableParse = nullableParse;
    StrictTypeParser.supportTypes = [
        'int32', 'number', 'string', 'boolean',
        'Date', 'FullDate', 'byte', 'binary'
    ];
})(StrictTypeParser = exports.StrictTypeParser || (exports.StrictTypeParser = {}));
