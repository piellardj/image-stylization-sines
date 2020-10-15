import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";

const data = {
    title: "Image transform: sines",
    description: "Transformation of a picture into a series of sine waves.",
    introduction: [
        "PLACEHOLDER_INTRO"
    ],
    githubProjectName: "image-transform-sines",
    additionalLinks: [],
    styleFiles: [],
    scriptFiles: [
        "script/main.min.js"
    ],
    indicators: [],
    canvas: {
        width: 512,
        height: 512,
        enableFullscreen: true
    },
    controlsSections: [
        {
            title: "Input",
            controls: [
                {
                    type: Demopage.supportedControls.FileUpload,
                    id: "input-image-upload-button",
                    accept: [".png", ".jpg", ".bmp", ".webp"],
                    defaultMessage: "Upload an image"
                }
            ]
        },
        {
            title: "Waves",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Count",
                    id: "vertical-resolution-range-id",
                    min: 5,
                    max: 100,
                    value: 50,
                    step: 5
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Amplitude",
                    id: "max-amplitude-range-id",
                    min: 0,
                    max: 1,
                    value: 0.98,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Frequency",
                    id: "max-frequency-range-id",
                    min: 0.1,
                    max: 5,
                    value: 2,
                    step: 0.1
                }
            ]
        },
        {
            title: "Display",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Line width",
                    id: "line-width-range-id",
                    min: 1,
                    max: 10,
                    value: 1,
                    step: 0.5
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Invert",
                    id: "invert-colors-checkbox-id",
                    checked: false
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "True intensity",
                    id: "true-intensity-checkbox-id",
                    checked: true
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Blur",
                    id: "blur-range-id",
                    min: 0,
                    max: 20,
                    value: 0,
                    step: 1
                }
            ]
        },
        {
            title: "Output",
            controls: [
                {
                    type: Demopage.supportedControls.FileDownload,
                    id: "result-download-id",
                    label: "Download as SVG",
                    flat: true
                }
            ]
        }
    ]
};

const SRC_DIR = path.resolve(__dirname);
const DEST_DIR = path.resolve(__dirname, "..", "docs");
const minified = true;

const buildResult = Demopage.build(data, DEST_DIR, {
    debug: !minified,
});

// disable linting on this file because it is generated
buildResult.pageScriptDeclaration = "/* tslint:disable */\n" + buildResult.pageScriptDeclaration;

const SCRIPT_DECLARATION_FILEPATH = path.join(SRC_DIR, "ts", "page-interface-generated.ts");
fs.writeFileSync(SCRIPT_DECLARATION_FILEPATH, buildResult.pageScriptDeclaration);

fse.copySync(path.join(SRC_DIR, "resources"), path.join(DEST_DIR, "resources"));