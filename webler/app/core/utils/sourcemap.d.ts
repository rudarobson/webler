declare module Webler {
  interface SourceMapFile {
    version:number;
    file: string;
    sourceRoot: string;
    sources: string[];
  }
  interface SourceMap {
    getMap:(file:string)=>SourceMapFile;
    flattenSources: (map: any, dir: string) => any;
  }
}
