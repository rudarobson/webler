declare module Components {
  interface ComponentsOptions {
    srcFile: string;
    ignoreAttribute: string;
    attrAction: string;//replace or merge
    attrs: { [attributeName: string]: string; };//custom replace or merged indexed by attribute name
    stopOnNotFound: boolean,
    validateName: (name: string) => boolean;
    importer: Importer;
  }

  interface Importer {
    (path: string, relativeTo?: string, alias?: string): ImportResult[];
  }

  interface ImportResult {
    name: string;
    path: string;
  }
}
