export class FullDate {
  private date: Date;
  constructor(...argv: any) {
    this.date = (()=>{
      if (argv.length==1) {
        const arg = argv[0];
        if (arg instanceof FullDate) return new Date(+arg);
        if (arg instanceof Date) return arg;
        if (typeof arg === 'string') {
          const tokens = /^(\d+)-(\d+)-(\d+)$/g.exec(arg)?.slice(1, 4);
          if (tokens) return new Date(+tokens[0], +tokens[1]-1, +tokens[2]);
        }
        return new Date(arg);
      } else if (argv.length==3) {
        return new Date(argv[0], argv[1]-1, argv[2]);
      }
      return new Date();
    })();
  }
  toString(): string {
    const d = this.date;
    const f = (s: any) => ('0'+s).slice(-2);
    return `${d.getFullYear()}-${f(d.getMonth()+1)}-${f(d.getDate())}`;
  }
  toJSON(): string {
    return this.toString();
  }
  valueOf(): number {
    return new Date(this.date).setHours(0, 0, 0, 0);
  }
  // prop
  getFullYear(): number {
    return this.date.getFullYear();
  }
  getMonth(): number {
    return this.date.getMonth()+1;
  }
  getDate(): number {
    return this.date.getDate();
  }
}
