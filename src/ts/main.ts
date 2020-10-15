import { Parameters } from "./parameters";
import { InputImage } from "./input-image";
import { PlotterBase, IPlotterInfo, ISize } from "./plotter-base";
import { PlotterCanvas2D } from "./plotter-canvas-2d";
import { PlotterSVG } from "./plotter-svg";

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
        width: usedDisplayWidth,
        height: usedDisplayHeight
    };
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

    inputImage.resize(plotter.size.width, Parameters.verticalResolution);

    // preserve aspect ratio no matter the size of the canvas
    const inputImageAspectRatio = inputImage.sourceImageAspectRatio;
    const maxSize = plotter.size;
    const usedSize = computeBiggestFittingRectangle(plotter.size, inputImageAspectRatio);

    const startX = 0.5 * (maxSize.width - usedSize.width);
    const startY = 0.5 * (maxSize.height - usedSize.height);

    const invertColors = Parameters.invertColors;
    const scalingX = usedSize.width / inputImage.width;
    const scalingY = usedSize.height / inputImage.height;
    const maxFrequency = scalingX * Parameters.maxFrequency;
    const maxAmplitude = 0.5 * scalingY * Parameters.maxAmplitude;

    const dX = 1 / (2 * maxFrequency);
    for (let iY = 0; iY < inputImage.height; iY++) {
        plotter.startLine();

        const baselineY = startY + (iY + 0.5) * scalingY;
        let angle = 0;
        for (let iX = 0; iX < inputImage.width - 1; iX += dX) {
            const darkness = invertColors ? inputImage.sample(iX, iY) : 1 - inputImage.sample(iX, iY);

            const frequency = darkness * maxFrequency;
            const amplitude = darkness * maxAmplitude;

            const x = startX + (iX + 0.5) * scalingX;
            const y = baselineY + amplitude * Math.sin(angle);

            plotter.addPointToLine(x, y);
            angle += frequency * dX;
        }

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

const svgPlotter = new PlotterSVG();
Parameters.addDownloadObserver(() => {
    plot(svgPlotter);

    const fileName = "image-as-sines.svg";
    const fileType = "text/plain";
    const svgString = svgPlotter.export();

    const blob = new Blob([svgString], { type: fileType });
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
