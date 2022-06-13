interface WriteStream {
  write(s: string): void;
  on(s: string, callback: () => void): void;
  end(): void;
}

export class StringStream implements WriteStream {
  private content = '';
  write(s: string) {
    this.content += s;
  }
  on() {}
  end() {}
  toString(): string {
    return this.content;
  }
}

export class CodePrinter {
  private cIndent = 0;
  constructor(
    private writeStream: WriteStream = new StringStream(),
    private indentString: string = '  ',
  ) {}
  writeln(s = '', dIndent = 0, pretab = dIndent<0) {
    if (pretab) this.cIndent = Math.max(0, this.cIndent + dIndent);
    this.write(`${this.indentString.repeat(this.cIndent) + s}\n`);
    if (!pretab) this.cIndent = Math.max(0, this.cIndent + dIndent);
  }
  write(s: string) {
    this.writeStream.write(s);
  }
  tab(x: number) {
    this.cIndent += x;
  }
  end(): Promise<void> {
    return new Promise(rsv => {
      this.writeStream.on('finish', rsv);
      this.writeStream.end();
    });
  }
}
