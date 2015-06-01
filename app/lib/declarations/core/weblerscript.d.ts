interface WeblerScriptParameters {
  includes?: string[];
  vSrc: string;
  vDest: string;
}

interface WeblerScriptInclude {
  src: string;
  type: string;
}

interface WeblerScript {
  parse: (source: string, opt: WeblerScriptParameters) => WeblerScriptInclude[];
}
