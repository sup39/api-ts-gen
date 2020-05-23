"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function removeTime(date) {
    return new Date(date.setHours(0, 0, 0, 0));
}
var FullDate = /** @class */ (function () {
    function FullDate() {
        var argv = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            argv[_i] = arguments[_i];
        }
        this._date = removeTime((function () {
            var _a, _b, _c;
            if (argv.length == 0)
                return new Date();
            if (argv.length == 1) {
                var arg = argv[0];
                if (arg instanceof FullDate)
                    return new Date(+arg);
                if (arg instanceof Date)
                    return arg;
                if (typeof arg === 'string') {
                    var tokens = (_a = /^(\d+)-(\d+)-(\d+)$/g.exec(arg)) === null || _a === void 0 ? void 0 : _a.slice(1, 4);
                    if (tokens)
                        return new Date(+tokens[0], +tokens[1] - 1, +tokens[2]);
                }
                return new Date(arg);
            }
            return new Date(argv[0], ((_b = argv[1]) !== null && _b !== void 0 ? _b : 1) - 1, (_c = argv[2]) !== null && _c !== void 0 ? _c : 1);
        })());
    }
    FullDate.prototype.toString = function () {
        var d = this._date;
        var f = function (s) { return ('0' + s).slice(-2); };
        return d.getFullYear() + "-" + f(d.getMonth() + 1) + "-" + f(d.getDate());
    };
    FullDate.prototype.toJSON = function () {
        return this.toString();
    };
    FullDate.prototype.valueOf = function () {
        return this._date.valueOf();
    };
    Object.defineProperty(FullDate.prototype, "date", {
        // getter
        get: function () {
            return new Date(this._date);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FullDate.prototype, "year", {
        get: function () {
            return this._date.getFullYear();
        },
        // setter
        set: function (val) {
            this._date.setFullYear(val);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FullDate.prototype, "month", {
        get: function () {
            return this._date.getMonth() + 1;
        },
        set: function (val) {
            this._date.setMonth(val - 1);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FullDate.prototype, "day", {
        get: function () {
            return this._date.getDate();
        },
        set: function (val) {
            this._date.setDate(val);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FullDate.prototype, "dayOfWeek", {
        get: function () {
            return this._date.getDay();
        },
        enumerable: true,
        configurable: true
    });
    // func
    FullDate.prototype.advance = function (period) {
        return new FullDate(this._date.valueOf() + period * 86400e3);
    };
    FullDate.prototype.distanceFrom = function (d0) {
        return (this.valueOf() - d0.valueOf()) / 86400e3;
    };
    return FullDate;
}());
exports.FullDate = FullDate;
