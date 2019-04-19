"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var OS = __importStar(require("os"));
var archiver = __importStar(require("archiver"));
var child_process_1 = require("child_process");
var rcopy = require("recursive-copy");
/// Common RadJav developer tools.
var RadJavTools = /** @class */ (function () {
    function RadJavTools() {
    }
    /// Create a project.
    RadJavTools.createProject = function (appFolder, radJavBuildDir, dependenciesDir, examplesDir) {
        if (radJavBuildDir === void 0) { radJavBuildDir = "./RadJav"; }
        if (dependenciesDir === void 0) { dependenciesDir = "./dependencies"; }
        if (examplesDir === void 0) { examplesDir = "./examples"; }
        if (appFolder === "") {
            throw new Error("You must specify where to create the project!");
            return;
        }
        if (fs.existsSync(appFolder) == false)
            fs.mkdirSync(appFolder);
        fs.copyFileSync(examplesDir + "/window/window.xrj", appFolder + "/app.xrj");
        fs.copyFileSync(path.normalize("./resources/RadJavApp.htm"), appFolder + "/RadJavApp.htm");
        rcopy(radJavBuildDir + "/", appFolder + "/RadJav/", { overwrite: true });
        rcopy(dependenciesDir + "/", appFolder + "/dependencies/", { overwrite: true });
    };
    /// Build an iOS IPA.
    RadJavTools.buildIPA = function (binPath, appFolder, customFileName, outputPath) {
        if (customFileName === void 0) { customFileName = "app.xrj"; }
        if (outputPath === void 0) { outputPath = "./app.ipa"; }
        var dirName = path.normalize(appFolder);
        if (fs.existsSync(dirName + "/" + customFileName) == false) {
            throw new Error(customFileName + " not found in " + dirName);
            return;
        }
        var file = fs.createWriteStream(outputPath);
        var zip = archiver("zip", { zlib: { level: 9 } });
        zip.pipe(file);
        zip.directory(path.join(binPath, "/Payload/"), "Payload");
        zip.file(dirName + "/" + customFileName, { name: "Payload/RadJavVM.app/app.xrj" });
        zip.directory(dirName, "Payload/RadJavVM.app/");
        zip.finalize();
    };
    /// Build an Android APK.
    RadJavTools.buildAPK = function (binPath, appFolder, customFileName, androidsdk, jarSignerPath, outputPath) {
        if (customFileName === void 0) { customFileName = "app.xrj"; }
        if (androidsdk === void 0) { androidsdk = ""; }
        if (jarSignerPath === void 0) { jarSignerPath = ""; }
        if (outputPath === void 0) { outputPath = "./app.apk"; }
        var dirName = path.normalize(appFolder);
        if (androidsdk === "") {
            if (process.platform == "win32") {
                androidsdk = OS.homedir() + "\\AppData\\Local\\Android\\Sdk";
                if (fs.existsSync("C:/Program Files/Android/Android Studio/jre/bin/jarsigner.exe") == true)
                    jarSignerPath = "C:/Program Files/Android/Android Studio/jre/bin/jarsigner.exe";
                if (fs.existsSync("C:/Program Files (x86)/Java/jdk/bin/jarsigner.exe") == true)
                    jarSignerPath = "C:/Program Files (x86)/Java/jdk/bin/jarsigner.exe";
            }
            if (process.platform == "linux") {
                androidsdk = OS.homedir() + "/Android\\Sdk";
                jarSignerPath = "jarsigner";
            }
            if (process.platform == "darwin") {
                androidsdk = OS.homedir() + "/Library/Android\\sdk";
                jarSignerPath = "jarsigner";
            }
        }
        if (fs.existsSync(dirName + "/" + customFileName) == false) {
            throw new Error(customFileName + " not found in " + dirName);
            return;
        }
        var dirs = fs.readdirSync(androidsdk + "/build-tools/");
        var buildToolsDir = path.normalize(androidsdk + "/build-tools/" + dirs[(dirs.length - 1)]);
        /*dirs = fs.readdirSync (`${androidsdk}/platforms/`);
        let platformDir: string = dirs[(dirs.length - 1)];
        let sdkPath: string = path.normalize (`${__dirname}/../sdk/prebuilt/android/`);
        let androidI: string = path.normalize (`${androidsdk}/platforms/${platformDir}/android.jar`);
        let sdkAPK: string = path.normalize (`${sdkPath}/app.apk`);*/
        /*execSync (`${buildToolsDir}/aapt package -f -m -J gen -M ${sdkPath}/AndroidManifest.xml -S ${sdkPath}/res -I ${androidI}`);
        execSync (`${buildToolsDir}/aapt package -f -M ${sdkPath}/AndroidManifest.xml -S ${sdkPath}/res -I ${androidI} -F ${sdkAPK}.unaligned`);
        execSync (`${buildToolsDir}/aapt add ${sdkAPK} ${sdkPath}/classes.dex`);*/
        var file = fs.createWriteStream(outputPath);
        var zip = archiver("zip");
        file.on("close", function () {
            child_process_1.execSync("\"" + buildToolsDir + "/apksigner\" sign --ks \"" + OS.homedir() + "/.android/debug.keystore\" --ks-key-alias androiddebugkey --ks-pass pass:\"android\" \"" + outputPath + "\"");
            //execSync (`"${jarSignerPath}" -keystore "${OS.homedir ()}/.android/debug.keystore" -storepass "android" "${__dirname}/app.apk" androiddebugkey`);
            //execSync (`"${buildToolsDir}/zipalign" -f 4 "${__dirname}/app.apk" "${__dirname}/app-debug.apk"`);
            //fs.unlinkSync (`${__dirname}/app.apk`);
        }.bind(this));
        zip.pipe(file);
        zip.directory(binPath, false);
        zip.file(dirName + "/" + customFileName, { name: "assets/app.xrj" });
        zip.directory(dirName, "assets/");
        zip.finalize();
    };
    /// Convert .NET designer UI to RadJav GUI JSON.
    RadJavTools.convertToGUIJSON = function (fileContent, fileName) {
        var fileType = path.extname(fileName);
        fileType = fileType.toLowerCase();
        var thisType = "this";
        var newType = "new";
        if (fileType == ".vb") {
            thisType = "Me";
            newType = "New";
        }
        var convertibleTypes = [
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
        var guiJSON = [];
        var parents = {};
        for (var iIdx = 0; iIdx < convertibleTypes.length; iIdx++) {
            var convType = convertibleTypes[iIdx];
            var findStr = newType + " " + convType.dotNetType + "\\(\\)";
            findStr = findStr.replace(new RegExp("\\.", "g"), "\\.");
            var findReg = new RegExp("(?<=" + thisType + "\\.)(.*)(?= = " + findStr + ")", "g");
            var foundNames = fileContent.match(findReg);
            if (foundNames == null)
                continue;
            for (var iJdx = 0; iJdx < foundNames.length; iJdx++) {
                var foundName = foundNames[iJdx];
                var obj = { type: convType.radjavType, name: foundName };
                findReg = new RegExp("(?<=" + thisType + "\\." + foundName + "\\.Location = " + newType + " System\\.Drawing\\.Point\\()(.*)(?=\\))");
                obj["position"] = fileContent.match(findReg);
                findReg = new RegExp("(?<=" + thisType + "\\." + foundName + "\\.Size = " + newType + " System\\.Drawing\\.Size\\()(.*)(?=\\))");
                obj["size"] = fileContent.match(findReg);
                findReg = new RegExp("(?<=" + thisType + "\\." + foundName + "\\.Text = \\\")(.*)(?=\\\")");
                obj["text"] = fileContent.match(findReg);
                findReg = new RegExp("(?<=" + thisType + "\\." + foundName + "\\.Visible = )(.*)");
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
                        var visible = obj["visibility"][0].toLowerCase();
                        if (visible == "true")
                            obj["visibility"] = true;
                        if (visible == "false")
                            obj["visibility"] = false;
                    }
                }
                else
                    delete obj["visibility"];
                guiJSON.push(obj);
                findReg = new RegExp("(?<=" + thisType + "\\." + foundName + "\\.Controls\\.Add\\(" + thisType + "\\.)(.*)(?=\\))", "g");
                var howCuteItsAParent = fileContent.match(findReg);
                if (howCuteItsAParent != null) {
                    if (howCuteItsAParent.length > 0) {
                        parents[foundName] = obj;
                        for (var iKdx = 0; iKdx < howCuteItsAParent.length; iKdx++) {
                            var child = howCuteItsAParent[iKdx];
                            for (var iUdx = 0; iUdx < guiJSON.length; iUdx++) {
                                var guiObj = guiJSON[iUdx];
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
    };
    return RadJavTools;
}());
exports.RadJavTools = RadJavTools;
//# sourceMappingURL=index.js.map