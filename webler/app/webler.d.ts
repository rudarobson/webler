declare var wRequire;
declare var wPackage;
declare module Webler {
  interface Webler {
    require: (p: string) => any,
    package: (p: string) => any,
    wFile: (cwd: string, route: string) => Webler.WFile;
    configPath: (src: string, dest: string) => void;
    wpath: WPath;
  }

  interface WPath {
    relative: (from: string, to: string) => string;
    processCwd: (rel?: string) => string;
    src: (rel?: string) => string;
    dest: (rel?: string) => string;
  }

  interface WFile {
    cwd: () => string;
    setCWD: (val: string) => void;
    src: () => string;
    setSrc: (val: string) => void;
    fullPath: () => string;
  }
}

declare var Webler: Webler.Webler;
