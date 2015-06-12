declare module Webler.CommandLine {
  interface WebleOptions {
    production: boolean;
  }

  interface ServerOptions {
    port:number;
    host:string;
    root:string;
    open:boolean;
  }
}
