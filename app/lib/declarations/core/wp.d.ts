interface VPManager {
  vSrc: () => string;

  vDest: () => string;

  resolveSrc: (p: string) => string;

  unresolveSrc: (p: string) => string;

  resolveDest: (p: string) => string;

  unresolveDest: (p: string) => string;

  trim: (p: string) => string;
}

interface TPManager {

  dir: () => string;

  write: (content: string, preferredName?: string) => string;

  generateName: () => string;

  generatePath: () => string;
}

interface WPManager {
  vp: VPManager;
  tp: TPManager;
}
