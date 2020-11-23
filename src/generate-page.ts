import * as fs from "fs";
import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";

const data = {
    title: "Lines",
    description: "Transformation of a picture into lines.",
    introduction: [
        "This is a simple tool that turns images into lines.",
        "The result can be exported in the SVG format."
    ],
    githubProjectName: "image-stylization-sines",
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
            title: "Lines",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    id: "lines-type-tabs-id",
                    unique: true,
                    options: [
                        {
                            label: "Straight",
                            value: "0",
                            checked: true,
                        },
                        {
                            label: "Spiral",
                            value: "1",
                            checked: false,
                        },
                        {
                            label: "Polygon",
                            value: "2",
                            checked: false,
                        },
                        {
                            label: "Sines",
                            value: "3",
                            checked: false,
                        },
                    ]
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Density",
                    id: "lines-count-range-id",
                    min: 10,
                    max: 200,
                    value: 70,
                    step: 10
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Orientation",
                    id: "orientation-range-id",
                    min: 0,
                    max: 90,
                    value: 0,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Sides",
                    id: "lines-sides-range-id",
                    min: 3,
                    max: 15,
                    value: 5,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Amplitude",
                    id: "lines-amplitude-range-id",
                    min: 0,
                    max: 1,
                    value: 0.3,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Frequency",
                    id: "lines-frequency-range-id",
                    min: 0,
                    max: 5,
                    value: 1,
                    step: 0.1
                },
            ]
        },
        {
            title: "Pattern",
            controls: [
                {
                    type: Demopage.supportedControls.Tabs,
                    title: "Pattern",
                    id: "pattern-tabs-id",
                    unique: true,
                    options: [
                        {
                            label: "Waves",
                            value: "0",
                            checked: true,
                        },
                        {
                            label: "Dithering",
                            value: "1",
                        },
                    ]
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
                    min: 0.01,
                    max: 1,
                    value: 0.4,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Angle",
                    id: "angle-range-id",
                    min: -0.15,
                    max: 0.15,
                    value: 0,
                    step: 0.01
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Squareness",
                    id: "wave-squareness-range-id",
                    min: 0,
                    max: 1,
                    value: 0,
                    step: 0.01
                },
            ]
        },
        {
            title: "Display",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Thickness",
                    id: "line-thickness-range-id",
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