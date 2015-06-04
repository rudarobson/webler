declare module Bundle {
  interface Options {
    files: string[];
    importers: { [id: string]: Bundler; };
  }

  interface File {
    type: string;
    dest: string;
    srcs: string[];
  }

  interface BundlerOptions {
    isDebug: boolean;
    elements: Dom.Element[];
  }

  interface BundlerResult {
    elements: Dom.Element[];
  }

  interface Bundler {
    (options: BundlerOptions): BundlerResult;//return the result files path in the destination folder
  }
}
