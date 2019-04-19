export interface ConvertibleType {
    dotNetType: string;
    radjavType: string;
}
export declare class RadJavTools {
    static createProject(appFolder: string, radJavBuildDir?: string, dependenciesDir?: string, examplesDir?: string): void;
    static buildIPA(binPath: string, appFolder: string, customFileName?: string, outputPath?: string): void;
    static buildAPK(binPath: string, appFolder: string, customFileName?: string, androidsdk?: string, jarSignerPath?: string, outputPath?: string): void;
    static convertToGUIJSON(fileContent: string, fileName: string): string;
}
