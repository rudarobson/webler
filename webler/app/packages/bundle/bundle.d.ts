declare module Bundle {
  interface Config {
    isProduction: boolean;
  }

  interface Bundler {
    addScriptsFileSolver: (type: string, handler: Bundle.FileHandler) => void;
    addStylesFileSolver: (type: string, handler: Bundle.FileHandler) => void;
    start: (config:Webler.WeblePackageOptions) => void;
  }

  interface FileMapResult {
    map: Webler.WFile;
    result: Webler.WFile;
  }

  interface FileHandler {
    (patterns: string[]): Bundle.FileMapResult[];
  }
}
