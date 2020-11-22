import { InputImage } from "./input-image";
import { IPoint } from "./interfaces/i-point";
import { ISize } from "./interfaces/i-size";
import { Parameters, ELinesPattern } from "./parameters";
import { PatternBase } from "./pattern/pattern-base";
import { PatternStraightLines } from "./pattern/pattern-straight-lines";
import { PatternSines } from "./pattern/pattern-sines";
import { PatternSpiral } from "./pattern/pattern-spiral";
import { IPlotterInfo } from "./plotter/plotter-base";
import { PatternPolygon } from "./pattern/pattern-polygon";

function buildPlotterInfos(): IPlotterInfo {
    return {
        backgroundColor: Parameters.invertColors ? "black" : "white",
        lineColor: Parameters.invertColors ? "white" : "black",
        lineThickness: Parameters.lineThickness,
        blur: Parameters.blur,
    };
}

interface IImageFitting {
    sizeInPlotter: ISize,
    relativeToAbsolute: (relativeCoords: IPoint) => IPoint;
    zoomFactor: number,
};

function fitImageInPlotter(maxSize: ISize, aspectRatio: number): IImageFitting {
    const displayAspectRatio = maxSize.width / maxSize.height;

    const sizeInPlotter: ISize = {
        width: maxSize.width,
        height: maxSize.height,
    };
    if (aspectRatio > displayAspectRatio) {
        sizeInPlotter.height = Math.floor(sizeInPlotter.height * displayAspectRatio / aspectRatio);
    } else if (aspectRatio < displayAspectRatio) {
        sizeInPlotter.width = Math.floor(sizeInPlotter.width * aspectRatio / displayAspectRatio);
    }

    const offSetX = 0.5 * (maxSize.width - sizeInPlotter.width);
    const offSetY = 0.5 * (maxSize.height - sizeInPlotter.height);
    const relativeToAbsolute = (relativeCoords: IPoint): IPoint => {
        return {
            x: relativeCoords.x + offSetX,
            y: relativeCoords.y + offSetY,
        };
    };

    const minSide = Math.min(sizeInPlotter.width, sizeInPlotter.height);
    const baseMinSide = Math.min(aspectRatio, 1 / aspectRatio);

    return {
        sizeInPlotter,
        relativeToAbsolute,
        zoomFactor: minSide / baseMinSide,
    };
}

type SamplingFunction = (inputImage: InputImage, coords: IPoint) => number;
function chooseBestSamplingFunction(): SamplingFunction {
    if (Parameters.trueIntensity) {
        if (Parameters.invertColors) {
            return (inputImage: InputImage, coords: IPoint) => Math.sqrt(inputImage.sample(coords));
        } else {
            return (inputImage: InputImage, coords: IPoint) => Math.sqrt(1.001 - inputImage.sample(coords));
        }
    } else {
        if (Parameters.invertColors) {
            return (inputImage: InputImage, coords: IPoint) => inputImage.sample(coords);
        } else {
            return (inputImage: InputImage, coords: IPoint) => 1 - inputImage.sample(coords);
        }
    }
}

type NormalRotationFunction = (normal: IPoint) => IPoint;
function computeNormalRotationFunction(): NormalRotationFunction {
    const angle = Parameters.angle * 2 * Math.PI;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const lengthAdjustment = 1 / cosAngle; // to maintain the waves height no matter the angle
    return (normal: IPoint): IPoint => {
        return {
            x: (cosAngle * normal.x - sinAngle * normal.y) * lengthAdjustment,
            y: (sinAngle * normal.x + cosAngle * normal.y) * lengthAdjustment,
        };
    };
}

type WaveFunction = (phase: number, amplitude: number) => number;
function computeWaveFunction(): WaveFunction {
    if (Parameters.waveSquareness < 0.005) {
        return (phase: number, amplitude: number) => amplitude * Math.sin(phase);
    }

    const sharpness = 1 - 0.99 * Parameters.waveSquareness;
    return (phase: number, amplitude: number) => {
        const sinPhase = Math.sin(phase);
        return amplitude * Math.sign(sinPhase) * Math.pow(Math.abs(sinPhase), sharpness);
    };
}

function choosePattern(imageSizeInPlotter: ISize, linesSpacing: number): PatternBase {
    const chosenPattern = Parameters.linesPattern;
    if (chosenPattern === ELinesPattern.STRAIGHT) {
        return new PatternStraightLines(imageSizeInPlotter, linesSpacing);
    } else if (chosenPattern === ELinesPattern.SPIRAL) {
        return new PatternSpiral(imageSizeInPlotter, linesSpacing);
    } else if (chosenPattern === ELinesPattern.POLYGON) {
        return new PatternPolygon(imageSizeInPlotter, linesSpacing);
    } else {
        return new PatternSines(imageSizeInPlotter, linesSpacing);
    }
}

export {
    buildPlotterInfos,
    chooseBestSamplingFunction,
    choosePattern,
    computeNormalRotationFunction,
    computeWaveFunction,
    fitImageInPlotter,
};
