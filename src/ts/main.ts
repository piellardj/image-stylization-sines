import { Parameters } from "./parameters";
import { InputImage } from "./input-image";

import { IPoint } from "./interfaces/i-point";

import { PlotterBase } from "./plotter/plotter-base";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { PlotterSVG } from "./plotter/plotter-svg";

import * as Helpers from "./helpers";

import "./page-interface-generated";

function plot(image: InputImage, plotter: PlotterBase): void {
    const start = Date.now();

    if (image == null) {
        console.log("Image not loaded!");
        return;
    }

    const displayInfos = Helpers.buildPlotterInfos();
    plotter.initialize(displayInfos);

    const plotterSize = plotter.size;
    const imageFitting = Helpers.fitImageInPlotter(plotterSize, image.sourceImageAspectRatio);

    const baseLineSpacing = 1 / Parameters.linesCount;
    const linesSpacing = baseLineSpacing * imageFitting.zoomFactor;

    const baseMaxFrequency = 500 * Parameters.maxFrequency;
    const maxFrequency = baseMaxFrequency / imageFitting.zoomFactor;

    const maxAmplitude = 0.5 * (linesSpacing - displayInfos.lineThickness) * Parameters.maxAmplitude;

    const lines = Helpers.chooseLines(imageFitting.sizeInPlotter, linesSpacing);

    image.resize(lines.suggestedImageSize);

    const samplingFunction = Helpers.chooseBestSamplingFunction();
    const normalRotation = Helpers.computeNormalRotationFunction();
    const waveFunction = Helpers.computeWaveFunction();

    const samplesPerPixel = Math.max(1, 2 * maxFrequency);
    const step = 1 / samplesPerPixel;
    for (let iLine = 0; iLine < lines.nbLines; iLine++) {
        let phase = 0;
        lines.walkOnLine(iLine, step, (point: IPoint, normal: IPoint) => {
            const normalizedCoords: IPoint = {
                x: point.x / (imageFitting.sizeInPlotter.width - 1),
                y: point.y / (imageFitting.sizeInPlotter.height - 1),
            };

            const outOfImage = normalizedCoords.x < 0 || normalizedCoords.x > 1 || normalizedCoords.y < 0 || normalizedCoords.y > 1;
            if (outOfImage) {
                if (plotter.hasStartedALine) {
                    plotter.endLine();
                }
                return;
            } else if (!plotter.hasStartedALine) {
                plotter.startLine();
            }

            const localDarkness = samplingFunction(inputImage, normalizedCoords);

            const localAmplitude = localDarkness * maxAmplitude;
            const localHeight = waveFunction(phase, localAmplitude);

            const rotatedNormal = normalRotation(normal);
            const dX = localHeight * rotatedNormal.x;
            const dY = localHeight * rotatedNormal.y;

            const absolutePoint = imageFitting.relativeToAbsolute(point);
            plotter.addPointToLine(absolutePoint.x + dX, absolutePoint.y + dY);

            const localFrequency = localDarkness * maxFrequency;
            phase += localFrequency * step;
        });

        if (plotter.hasStartedALine) {
            plotter.endLine();
        }
    }

    plotter.finalize();
    console.log(`Plotting took ${Date.now() - start} ms.`);
}

let inputImage: InputImage = null;

const canvasPlotter = new PlotterCanvas2D();
function plotOnCanvas(): void {
    plot(inputImage, canvasPlotter);
}
Parameters.addRedrawObserver(plotOnCanvas);

function updateBlur(blur: number): void {
    canvasPlotter.blur = blur;
}
Parameters.addBlurChangeObserver(updateBlur);
updateBlur(Parameters.blur);

Parameters.addDownloadObserver(() => {
    const svgPlotter = new PlotterSVG();
    plot(inputImage, svgPlotter);

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
