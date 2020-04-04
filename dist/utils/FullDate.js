"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FullDate = /** @class */ (function () {
    function FullDate() {
        var argv = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            argv[_i] = arguments[_i];
        }
        this.date = (function () {
            var _a;
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
            else if (argv.length == 3) {
                return new Date(argv[0], argv[1] - 1, argv[2]);
            }
            return new Date();
        })();
    }
    FullDate.prototype.toString = function () {
        var d = this.date;
        var f = function (s) { return ('0' + s).slice(-2); };
        return d.getFullYear() + "-" + f(d.getMonth() + 1) + "-" + f(d.getDate());
    };
    FullDate.prototype.toJSON = function () {
        return this.toString();
    };
    FullDate.prototype.valueOf = function () {
        return new Date(this.date).setHours(0, 0, 0, 0);
    };
    // prop
    FullDate.prototype.getFullYear = function () {
        return this.date.getFullYear();
    };
    FullDate.prototype.getMonth = function () {
        return this.date.getMonth() + 1;
    };
    FullDate.prototype.getDate = function () {
        return this.date.getDate();
    };
    return FullDate;
}());
exports.FullDate = FullDate;
