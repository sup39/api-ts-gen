interface WriteStream {
    write(s: string): void;
    on(s: string, callback: () => void): void;
    end(): void;
}
export declare class StringStream implements WriteStream {
    private content;
    write(s: string): void;
    on(): void;
    end(): void;
    toString(): string;
}
export declare class CodePrinter {
    private writeStream;
    private indentString;
    private cIndent;
    constructor(writeStream?: WriteStream, indentString?: string);
    writeln(s?: string, dIndent?: number, pretab?: boolean): void;
    write(s: string): void;
    tab(x: number): void;
    end(): Promise<void>;
}
export {};
