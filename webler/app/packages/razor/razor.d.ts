interface RazorPage {
  source: string;
  originalSource: string;
  destination: string;
  model: string;//json
  viewBag: string;//json
}

interface RazorConfig {
  layoutsPath: string;
  modelsPath: string;
  viewBagsPath: string;
  tmpDir: string;
  appSrcRoot: string;
  pages: RazorPage[];
}
