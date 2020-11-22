import { InputImage } from "./input-image";
import { IPoint } from "./interfaces/i-point";
import { ISize } from "./interfaces/i-size";
import { Parameters, ELinesType } from "./parameters";
import { LinesBase } from "./lines/lines-base";
import { LinesStraightLines } from "./lines/lines-straight-lines";
import { LinesSines } from "./lines/lines-sines";
import { LinesSpiral } from "./lines/lines-spiral";
import { IPlotterInfo } from "./plotter/plotter-base";
import { LinesPolygon } from "./lines/lines-polygon";

function buildPlotterInfos(): IPlotterInfo {
    return {
        backgroundColor: Parameters.invertColors ? "black" : "white",
        lineColor: Parameters.invertColors ? "white" : "black",
        lineThickness: Parameters.lineThickness,
        blur: Parameters.blur,
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

function chooseLines(imageSizeInPlotter: ISize, linesSpacing: number): LinesBase {
    const chosenType = Parameters.linesType;
    if (chosenType === ELinesType.STRAIGHT) {
        return new LinesStraightLines(imageSizeInPlotter, linesSpacing);
    } else if (chosenType === ELinesType.SPIRAL) {
        return new LinesSpiral(imageSizeInPlotter, linesSpacing);
    } else if (chosenType === ELinesType.POLYGON) {
        return new LinesPolygon(imageSizeInPlotter, linesSpacing);
    } else {
        return new LinesSines(imageSizeInPlotter, linesSpacing);
    }
}

function downloadTextFile(content: string, filename: string): void {
    const fileType = "text/plain";

    const blob = new Blob([content], { type: fileType });

    if (typeof window.navigator !== "undefined" && typeof window.navigator.msSaveBlob !== "undefined") { // for IE
        window.navigator.msSaveBlob(blob, filename);
    } else {
        const objectUrl = URL.createObjectURL(blob);

        const linkElement = document.createElement('a');
        linkElement.download = filename;
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
}

export {
    buildPlotterInfos,
    chooseBestSamplingFunction,
    chooseLines,
    computeNormalRotationFunction,
    computeWaveFunction,
    downloadTextFile,
};
