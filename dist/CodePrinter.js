"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StringStream = /** @class */ (function () {
    function StringStream() {
        this.content = '';
    }
    StringStream.prototype.write = function (s) {
        this.content += s;
    };
    StringStream.prototype.on = function () { };
    StringStream.prototype.end = function () { };
    StringStream.prototype.toString = function () {
        return this.content;
    };
    return StringStream;
}());
exports.StringStream = StringStream;
var CodePrinter = /** @class */ (function () {
    function CodePrinter(writeStream, indentString) {
        if (writeStream === void 0) { writeStream = new StringStream(); }
        if (indentString === void 0) { indentString = '  '; }
        this.writeStream = writeStream;
        this.indentString = indentString;
        this.cIndent = 0;
    }
    CodePrinter.prototype.writeln = function (s, dIndent, pretab) {
        if (s === void 0) { s = ''; }
        if (dIndent === void 0) { dIndent = 0; }
        if (pretab === void 0) { pretab = dIndent < 0; }
        if (pretab)
            this.cIndent = Math.max(0, this.cIndent + dIndent);
        this.write(this.indentString.repeat(this.cIndent) + s + "\n");
        if (!pretab)
            this.cIndent = Math.max(0, this.cIndent + dIndent);
    };
    CodePrinter.prototype.write = function (s) {
        this.writeStream.write(s);
    };
    CodePrinter.prototype.tab = function (x) {
        this.cIndent += x;
    };
    CodePrinter.prototype.end = function () {
        var _this = this;
        return new Promise(function (rsv) {
            _this.writeStream.on('finish', rsv);
            _this.writeStream.end();
        });
    };
    return CodePrinter;
}());
exports.CodePrinter = CodePrinter;
