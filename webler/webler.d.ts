declare module Webler {
  interface GOptions {
    production: boolean;
    tmpDir: string;
    ignoreFiles: string[];
  }

  interface WeblePackageOptions {
    files: Webler.WFile[];
    additionalFiles: Webler.WFile[];
    destCwd: string;
    options: any;
    gOptions: GOptions;
    glob: {
      src: string[],
      cwd: string,
      dest: string
    }
  }

  interface WebleOptions {
    options: GOptions;
    chainModules: {
      [moduleName: string]: {
        srcs: string[],
        cwd: string,
        destCwd: string,
        options: { [packageName: string]: any }
      }
    };
    modules: {
      [moduleName: string]: {
        srcs: string[],
        cwd: string,
        destCwd: string,
        options: any
      }
    };
  }
}
