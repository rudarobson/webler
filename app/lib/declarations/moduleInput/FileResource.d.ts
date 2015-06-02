interface FileResource {
  set: (type, value) => void;

  value: (type) => any;

  type: () => string;

  is: (type) => boolean;

  src: () => string;

  dest: () => string;

  addDependency: (file: string) => void;
  getDependencies: () => { [id: string]: any };
}
