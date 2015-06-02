interface FileDependecyManager {
  get: (fNmae: string) => FileDependency;
  persist: () => void;
}

interface FileDependencyData {
  lastModified: string;
}

interface FileDependency {
  add: (dep: string) => void;

  dependencies: () => FileDependency[];
}
