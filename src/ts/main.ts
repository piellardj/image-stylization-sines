import { Parameters } from "./parameters";
import { InputImage } from "./input-image";

import { PlotterBase } from "./plotter/plotter-base";
import { PlotterCanvas2D } from "./plotter/plotter-canvas-2d";
import { PlotterSVG } from "./plotter/plotter-svg";

import * as Helpers from "./helpers";

import "./page-interface-generated";

function plot(image: InputImage, plotter: PlotterBase): void {
    const start = performance.now();

    if (image == null) {
        console.log("Image not loaded!");
        return;
    }

    const displayInfos = Helpers.buildPlotterInfos();
    plotter.initialize(displayInfos);

    const imageFitting = plotter.fitImage(image.sourceImageAspectRatio);

    const baseLineSpacing = 1 / Parameters.linesCount;
    const linesSpacing = baseLineSpacing * imageFitting.zoomFactor;

    const lines = Helpers.chooseLines(imageFitting.sizeInPlotter, linesSpacing);
    const pattern = Helpers.choosePattern(imageFitting, linesSpacing);

    image.resize(lines.suggestedImageSize);

    for (let iLine = 0; iLine < lines.nbLines; iLine++) {
        pattern.drawLine(lines, iLine, image, plotter);
    }

    plotter.finalize();
    console.log(`Plotting took ${performance.now() - start} ms.`);
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
    const svgString = svgPlotter.export();
    const filename = "image-as-sines.svg";
    Helpers.downloadTextFile(svgString, filename);
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
