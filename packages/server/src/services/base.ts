export class Service {
  public req;
  public res;
  public name: string;

  constructor(name: string, req?: any, res?: any) {
    this.req = req;
    this.res = res;
    this.name = name;
  }

  async initRequest(req: any, res: any) {
    this.req = req;
    this.res = res;
  }

  // default home page router: http://xxxxxx:port/
  default() {
    return `you just reach ${this.name}.`;
  }

  ping() {
    return "pong";
  }
}
