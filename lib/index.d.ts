import * as http from "http";
import express = require("express");
export interface ConvertibleType {
    dotNetType: string;
    radjavType: string;
}
export declare class RadJavTools {
    static app: express.Application;
    static webServer: http.Server;
    static createProject(appFolder: string, radJavBuildDir?: string, dependenciesDir?: string, examplesDir?: string, htmlPage?: string): void;
    static buildIPA(binPath: string, appFolder: string, customFileName?: string, outputPath?: string): void;
    static getAndroidSDKPath(path: string): string;
    static buildAPK(binPath: string, appFolder: string, customFileName?: string, androidsdk?: string, jarSignerPath?: string, outputPath?: string): void;
    static installAPK(apkPath: string, androidsdk?: string, deviceId?: string): void;
    static installIPA(ipaPath: string, imobiledevicePath?: string, deviceId?: string): void;
    static startHTTP(location?: string, port?: number, listenAddr?: string): Promise<{
        port: number;
        listenAddr: string;
    }>;
    static convertToGUIJSON(fileContent: string, fileName: string): string;
}
