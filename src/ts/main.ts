import { Parameters } from "./parameters";
import { InputImage } from "./input-image";

import { IPoint } from "./interfaces/i-point";
import { ISize } from "./interfaces/i-size";

import { PlotterBase, IPlotterInfo } from "./plotter/plotter-base";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { PlotterSVG } from "./plotter/plotter-svg";

import { PatternBase } from "./pattern/pattern-base";
import { PatternStraightLines } from "./pattern/pattern-straight-lines";

import "./page-interface-generated";

function buildPlotterInfos(): IPlotterInfo {
    return {
        backgroundColor: Parameters.invertColors ? "black" : "white",
        lineColor: Parameters.invertColors ? "white" : "black",
        lineWidth: Parameters.lineWidth,
        blur: Parameters.blur,
    };
}

function computeBiggestFittingRectangle(maxSize: ISize, aspectRatio: number): ISize {
    const displayAspectRatio = maxSize.width / maxSize.height;

    let usedDisplayWidth = maxSize.width;
    let usedDisplayHeight = maxSize.height;
    if (aspectRatio > displayAspectRatio) {
        usedDisplayHeight *= displayAspectRatio / aspectRatio;
    } else if (aspectRatio < displayAspectRatio) {
        usedDisplayWidth *= aspectRatio / displayAspectRatio;
    }

    return {
        width: Math.floor(usedDisplayWidth),
        height: Math.floor(usedDisplayHeight),
    };
}

type SamplingFunction = (coords: IPoint) => number;
function chooseBestSamplingFunction(): SamplingFunction {
    if (Parameters.trueIntensity) {
        if (Parameters.invertColors) {
            return (coords: IPoint) => Math.sqrt(inputImage.sample(coords.x, coords.y));
        } else {
            return (coords: IPoint) => Math.sqrt(1.001 - inputImage.sample(coords.x, coords.y));
        }
    } else {
        if (Parameters.invertColors) {
            return (coords: IPoint) => inputImage.sample(coords.x, coords.y);
        } else {
            return (coords: IPoint) => 1 - inputImage.sample(coords.x, coords.y);
        }
    }
}

let inputImage: InputImage = null;

function plot(plotter: PlotterBase): void {
    const start = Date.now();

    if (inputImage == null) {
        console.log("Image not loaded!");
        return;
    }

    const displayInfos = buildPlotterInfos();
    plotter.initialize(displayInfos);

    const pattern: PatternBase = new PatternStraightLines(inputImage.size, plotter.size, Parameters.verticalResolution);
    inputImage.resize(pattern.wantedImageSize);

    const computeDarkness = chooseBestSamplingFunction();

    // preserve aspect ratio no matter the size of the canvas
    const inputImageAspectRatio = inputImage.sourceImageAspectRatio;
    const maxSize = plotter.size;
    const usedSize = computeBiggestFittingRectangle(plotter.size, inputImageAspectRatio);

    const startX = 0.5 * (maxSize.width - usedSize.width);
    const startY = 0.5 * (maxSize.height - usedSize.height);

    const scalingX = usedSize.width / inputImage.width;
    const scalingY = usedSize.height / inputImage.height;

    const inclinaisonAngle = 2 * Math.PI * Parameters.angle;
    const cosAngle = Math.cos(inclinaisonAngle);
    const sinAngle = Math.sin(inclinaisonAngle);

    const maxFrequency = 500 * Parameters.maxFrequency / inputImage.width;
    const maxAmplitude = 0.5 * scalingY * Parameters.maxAmplitude / cosAngle;

    function imageToCanvas(input: IPoint): IPoint {
        return {
            x: startX + (input.x + 0.5) * scalingX,
            y: startY + (input.y + 0.5) * scalingY,
        };
    }

    const stepX = 1 / (2 * maxFrequency);

    for (let iLine = 0; iLine < pattern.nbLines; iLine++) {
        plotter.startLine();

        let phase = 0;

        pattern.walkOnLine(iLine, stepX, (point: IPoint, normal: IPoint) => {
            const darkness = computeDarkness(point);

            const localAmplitude = darkness * maxAmplitude;
            const waveHeight = localAmplitude * Math.sin(phase);

            const rotatedNormal: IPoint = {
                x: normal.x * cosAngle - normal.y * sinAngle,
                y: normal.x * sinAngle + normal.y * cosAngle,
            };
            const dX = waveHeight * rotatedNormal.x;
            const dY = waveHeight * rotatedNormal.y;

            const absolutePoint = imageToCanvas(point);
            plotter.addPointToLine(absolutePoint.x + dX, absolutePoint.y + dY);

            const frequency = darkness * maxFrequency;
            phase += frequency * stepX;
        });

        plotter.endLine();
    }

    plotter.finalize();
    console.log(`Plotting took ${Date.now() - start} ms.`);
}

const canvasPlotter = new PlotterCanvas2D();
function plotOnCanvas(): void {
    plot(canvasPlotter);
}
Parameters.addRedrawObserver(plotOnCanvas);

function updateBlur(blur: number): void {
    canvasPlotter.blur = blur;
}
Parameters.addBlurChangeObserver(updateBlur);
updateBlur(Parameters.blur);

Parameters.addDownloadObserver(() => {
    const svgPlotter = new PlotterSVG();
    plot(svgPlotter);

    const fileName = "image-as-sines.svg";
    const fileType = "text/plain";
    const svgString = svgPlotter.export();

    const blob = new Blob([svgString], { type: fileType });

    if (typeof window.navigator !== "undefined" && typeof window.navigator.msSaveBlob !== "undefined") { // for IE
        window.navigator.msSaveBlob(blob, fileName);
    } else {
        const objectUrl = URL.createObjectURL(blob);

        const linkElement = document.createElement('a');
        linkElement.download = fileName;
        linkElement.href = objectUrl;
        linkElement.dataset.downloadurl = `${fileType}:${linkElement.download}:${linkElement.href}`;
        linkElement.style.display = "none";
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);

        // don't forget to free the objectURL after a few seconds
        setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
        }, 5000);
    }
});

function onImageLoad(image: HTMLImageElement): void {
    inputImage = new InputImage(image);
    Page.Canvas.showLoader(false);
    plotOnCanvas();
}
Parameters.addFileUploadObserver(onImageLoad);

Page.Canvas.showLoader(true);
const defaultImage = new Image();
defaultImage.addEventListener("load", () => {
    onImageLoad(defaultImage);
});
defaultImage.src = "./resources/cat.jpg";
