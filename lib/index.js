"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const OS = __importStar(require("os"));
const archiver = __importStar(require("archiver"));
const child_process_1 = require("child_process");
const express = require("express");
const rcopy = require("recursive-copy");
/// Common RadJav developer tools.
class RadJavTools {
    /// Create a project.
    static createProject(appFolder, radJavBuildDir = "./RadJav", dependenciesDir = "./dependencies", examplesDir = "./examples", htmlPage = "./resources/RadJavApp.htm") {
        if (appFolder === "") {
            throw new Error(`You must specify where to create the project!`);
            return;
        }
        if (fs.existsSync(appFolder) == false)
            fs.mkdirSync(appFolder);
        fs.copyFileSync(`${examplesDir}/window/window.xrj`, appFolder + "/app.xrj");
        fs.copyFileSync(path.normalize(htmlPage), appFolder + "/RadJavApp.htm");
        rcopy(`${radJavBuildDir}/`, appFolder + "/RadJav/", { overwrite: true });
        rcopy(`${dependenciesDir}/`, appFolder + "/dependencies/", { overwrite: true });
    }
    /// Build an iOS IPA.
    static buildIPA(binPath, appFolder, customFileName = "app.xrj", outputPath = "./app.ipa") {
        let dirName = path.normalize(appFolder);
        if (fs.existsSync(`${dirName}/${customFileName}`) == false) {
            throw new Error(`${customFileName} not found in ${dirName}`);
            return;
        }
        let file = fs.createWriteStream(outputPath);
        let zip = archiver("zip", { zlib: { level: 9 } });
        zip.pipe(file);
        zip.directory(path.join(binPath, "/Payload/"), "Payload");
        zip.file(`${dirName}/${customFileName}`, { name: "Payload/RadJavVM.app/app.xrj" });
        zip.directory(dirName, "Payload/RadJavVM.app/");
        zip.finalize();
    }
    /// Get the Android path.
    static getAndroidSDKPath(path) {
        if (path === "") {
            if (process.platform == "win32")
                path = `${OS.homedir()}\\AppData\\Local\\Android\\Sdk`;
            if (process.platform == "linux")
                path = `${OS.homedir()}/Android/Sdk`;
            if (process.platform == "darwin")
                path = `${OS.homedir()}/Library/Android/sdk`;
        }
        return (path);
    }
    /// Build an Android APK.
    static buildAPK(binPath, appFolder, customFileName = "app.xrj", androidsdk = "", jarSignerPath = "", outputPath = "./app.apk") {
        let dirName = path.normalize(appFolder);
        androidsdk = RadJavTools.getAndroidSDKPath(androidsdk);
        if (jarSignerPath === "") {
            if (process.platform == "win32") {
                if (fs.existsSync(`C:/Program Files/Android/Android Studio/jre/bin/jarsigner.exe`) == true)
                    jarSignerPath = `C:/Program Files/Android/Android Studio/jre/bin/jarsigner.exe`;
                if (fs.existsSync(`C:/Program Files (x86)/Java/jdk/bin/jarsigner.exe`) == true)
                    jarSignerPath = `C:/Program Files (x86)/Java/jdk/bin/jarsigner.exe`;
            }
            if (process.platform == "linux")
                jarSignerPath = "jarsigner";
            if (process.platform == "darwin")
                jarSignerPath = "jarsigner";
        }
        if (fs.existsSync(`${dirName}/${customFileName}`) == false) {
            throw new Error(`${customFileName} not found in ${dirName}`);
            return;
        }
        let dirs = fs.readdirSync(`${androidsdk}/build-tools/`);
        let buildToolsDir = path.normalize(`${androidsdk}/build-tools/${dirs[(dirs.length - 1)]}`);
        /*dirs = fs.readdirSync (`${androidsdk}/platforms/`);
        let platformDir: string = dirs[(dirs.length - 1)];
        let sdkPath: string = path.normalize (`${__dirname}/../sdk/prebuilt/android/`);
        let androidI: string = path.normalize (`${androidsdk}/platforms/${platformDir}/android.jar`);
        let sdkAPK: string = path.normalize (`${sdkPath}/app.apk`);*/
        /*execSync (`${buildToolsDir}/aapt package -f -m -J gen -M ${sdkPath}/AndroidManifest.xml -S ${sdkPath}/res -I ${androidI}`);
        execSync (`${buildToolsDir}/aapt package -f -M ${sdkPath}/AndroidManifest.xml -S ${sdkPath}/res -I ${androidI} -F ${sdkAPK}.unaligned`);
        execSync (`${buildToolsDir}/aapt add ${sdkAPK} ${sdkPath}/classes.dex`);*/
        let file = fs.createWriteStream(outputPath);
        let zip = archiver("zip");
        file.on("close", function () {
            child_process_1.execSync(`"${buildToolsDir}/apksigner" sign --ks "${OS.homedir()}/.android/debug.keystore" --ks-key-alias androiddebugkey --ks-pass pass:"android" "${outputPath}"`);
            //execSync (`"${jarSignerPath}" -keystore "${OS.homedir ()}/.android/debug.keystore" -storepass "android" "${__dirname}/app.apk" androiddebugkey`);
            //execSync (`"${buildToolsDir}/zipalign" -f 4 "${__dirname}/app.apk" "${__dirname}/app-debug.apk"`);
            //fs.unlinkSync (`${__dirname}/app.apk`);
        }.bind(this));
        zip.pipe(file);
        zip.directory(binPath, false);
        zip.file(`${dirName}/${customFileName}`, { name: "assets/app.xrj" });
        zip.directory(dirName, "assets/");
        zip.finalize();
    }
    /// Install an APK to a device.
    static installAPK(apkPath, androidsdk = "", deviceId = "") {
        androidsdk = RadJavTools.getAndroidSDKPath(androidsdk);
        let output = child_process_1.execSync(`${androidsdk}/platform-tools/adb install ${apkPath}`);
        /// @fixme Get the result from the installation.
    }
    /// Install an IPA to a device.
    static installIPA(ipaPath, imobiledevicePath = "ideviceinstaller", deviceId = "") {
        let output = child_process_1.execSync(`${imobiledevicePath} -i ${ipaPath}`);
        /// @fixme Get the result from the installation.
    }
    /// Start an HTTP server.
    static startHTTP(location = "./", port = 3453, listenAddr = "127.0.0.1") {
        let promise = new Promise(function (resolve, reject) {
            RadJavTools.app = express();
            RadJavTools.app.use(express.static(location));
            RadJavTools.app.get("/", function (req, res) {
                let filePath = path.normalize(`${location}/RadJavApp.htm`);
                if (fs.existsSync(filePath) == false)
                    filePath = path.normalize(`${location}/index.htm`);
                if (req.path != "/")
                    filePath = req.path;
                res.sendFile(path.normalize(filePath));
            });
            RadJavTools.webServer = RadJavTools.app.listen(port, listenAddr, null, function () {
                resolve({ port: port, listenAddr: listenAddr });
            });
        });
        return (promise);
    }
    /// Convert .NET designer UI to RadJav GUI JSON.
    static convertToGUIJSON(fileContent, fileName) {
        let fileType = path.extname(fileName);
        fileType = fileType.toLowerCase();
        let thisType = "this";
        let newType = "new";
        if (fileType == ".vb") {
            thisType = "Me";
            newType = "New";
        }
        let convertibleTypes = [
            { dotNetType: "System.Windows.Forms.Button", radjavType: "RadJav.GUI.Button" },
            { dotNetType: "System.Windows.Forms.Label", radjavType: "RadJav.GUI.Label" },
            { dotNetType: "System.Windows.Forms.TextBox", radjavType: "RadJav.GUI.Textbox" },
            { dotNetType: "System.Windows.Forms.CheckBox", radjavType: "RadJav.GUI.Checkbox" },
            { dotNetType: "System.Windows.Forms.ComboBox", radjavType: "RadJav.GUI.Combobox" },
            { dotNetType: "System.Windows.Forms.RadioButton", radjavType: "RadJav.GUI.Radio" },
            { dotNetType: "System.Windows.Forms.PictureBox", radjavType: "RadJav.GUI.Image" },
            { dotNetType: "System.Windows.Forms.ListView", radjavType: "RadJav.GUI.List" },
            { dotNetType: "System.Windows.Forms.GroupBox", radjavType: "RadJav.GUI.Container" }
        ];
        let guiJSON = [];
        let parents = {};
        for (let iIdx = 0; iIdx < convertibleTypes.length; iIdx++) {
            let convType = convertibleTypes[iIdx];
            let findStr = `${newType} ${convType.dotNetType}\\(\\)`;
            findStr = findStr.replace(new RegExp("\\.", "g"), "\\.");
            let findReg = new RegExp(`(?<=${thisType}\\.)(.*)(?= \= ${findStr})`, "g");
            let foundNames = fileContent.match(findReg);
            if (foundNames == null)
                continue;
            for (let iJdx = 0; iJdx < foundNames.length; iJdx++) {
                let foundName = foundNames[iJdx];
                let obj = { type: convType.radjavType, name: foundName };
                findReg = new RegExp(`(?<=${thisType}\\.${foundName}\\.Location = ${newType} System\\.Drawing\\.Point\\()(.*)(?=\\))`);
                obj["position"] = fileContent.match(findReg);
                findReg = new RegExp(`(?<=${thisType}\\.${foundName}\\.Size = ${newType} System\\.Drawing\\.Size\\()(.*)(?=\\))`);
                obj["size"] = fileContent.match(findReg);
                findReg = new RegExp(`(?<=${thisType}\\.${foundName}\\.Text = \\")(.*)(?=\\")`);
                obj["text"] = fileContent.match(findReg);
                findReg = new RegExp(`(?<=${thisType}\\.${foundName}\\.Visible = )(.*)`);
                obj["visibility"] = fileContent.match(findReg);
                if (obj["position"] != null) {
                    if (obj["position"].length > 0)
                        obj["position"] = obj["position"][0];
                }
                else
                    delete obj["position"];
                if (obj["size"] != null) {
                    if (obj["size"].length > 0)
                        obj["size"] = obj["size"][0];
                }
                else
                    delete obj["size"];
                if (obj["text"] != null) {
                    if (obj["text"].length > 0)
                        obj["text"] = obj["text"][0];
                }
                else
                    delete obj["text"];
                if (obj["visibility"] != null) {
                    if (obj["visibility"].length > 0) {
                        let visible = obj["visibility"][0].toLowerCase();
                        if (visible == "true")
                            obj["visibility"] = true;
                        if (visible == "false")
                            obj["visibility"] = false;
                    }
                }
                else
                    delete obj["visibility"];
                guiJSON.push(obj);
                findReg = new RegExp(`(?<=${thisType}\\.${foundName}\\.Controls\\.Add\\(${thisType}\\.)(.*)(?=\\))`, "g");
                let howCuteItsAParent = fileContent.match(findReg);
                if (howCuteItsAParent != null) {
                    if (howCuteItsAParent.length > 0) {
                        parents[foundName] = obj;
                        for (let iKdx = 0; iKdx < howCuteItsAParent.length; iKdx++) {
                            let child = howCuteItsAParent[iKdx];
                            for (let iUdx = 0; iUdx < guiJSON.length; iUdx++) {
                                let guiObj = guiJSON[iUdx];
                                if (guiObj.name == child) {
                                    if (parents[foundName].children == null)
                                        parents[foundName].children = [];
                                    parents[foundName].children.push(guiObj);
                                    guiJSON.splice(iUdx, 1);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
        return (JSON.stringify(guiJSON, null, 4));
    }
}
exports.RadJavTools = RadJavTools;
//# sourceMappingURL=index.js.map