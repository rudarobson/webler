interface Utils {
  mergeObjects: (obj1: any, obj2: any) => void;
  safeWriteFile: (dest: string, content: string) => void;
  deleteFolder: (folder: string) => void;
  changeFileExt: (fileName: string, ext: string) => string;
  concatFilesObjProp: (srcs: any[], propName: string) => string;
  packProps: (objs: any[], propName: string) => any[]
  concatFiles: (srcs: string[]) => string;
  resolveGlob: (src: string, dest: string, cwd: string) => { src: string, dest: string };
  fileExists: (p: string) => boolean;
  isRelative: (p: string) => boolean;
}
