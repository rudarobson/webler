declare module Components {
  interface ComponentsOptions {
    ignoreAttribute: string;
    attrAction: string;//replace or merge
    attrs: { [attributeName: string]: string; };//custom replace or merged indexed by attribute name
    stopOnNotFound: boolean,
    validateName: (name: string) => boolean;
    componentsPath:string;
    componentsExt:string;
    srcFile:string;
  }

  interface Importer {
    (path: string, relativeTo?: string, alias?: string): ImportResult[];
  }

  interface ImportResult {
    name: string;
    path: string;
  }
}
