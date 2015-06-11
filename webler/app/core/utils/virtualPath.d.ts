declare module Webler {
  interface VirtualPath {
    constructor(vSrc, vDest);
    vSrc: () => string;
    vDest: () => string;
    resolveSrc: () => string;
    unresolveSrc: () => string;
    resolveDest: () => string;
    unresolveDest: () => string;
    trim: () => string;
  }
  interface VirtualPathCreator {
    create: (p: string) => VirtualPath;
  }
}
