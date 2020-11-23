import { InputImage } from "../input-image";
import { IPoint } from "../interfaces/i-point";
import { LinesBase } from "../lines/lines-base";
import { Parameters } from "../parameters";
import { PlotterBase, IImageFitting, IPlotterInfo } from "../plotter/plotter-base";
import { PatternBase } from "./pattern-base";

type SamplingFunction = (inputImage: InputImage, coords: IPoint) => number;

function clamp(min: number, max: number, x: number): number {
    if (x < min) {
        return min;
    } else if (x > max) {
        return max;
    }
    return x;
}

class PatternDithering extends PatternBase {
    private readonly samplingFunction: SamplingFunction;

    private readonly imageFitting: IImageFitting;

    private readonly linesThickness: number;

    private readonly step: number;

    private static readonly ditheringPatterns: number[][] = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
        [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
        [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
        [1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        [1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0],
        [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
        [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
        [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
        [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1],
        [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    public constructor(imageFitting: IImageFitting, linesSpacing: number) {
        super();

        this.samplingFunction = PatternDithering.chooseBestSamplingFunction();

        this.imageFitting = imageFitting;

        this.linesThickness = Math.max(1, Parameters.maxAmplitude * linesSpacing);

        const MIN_FREQUENCY = 10;
        const MAX_FREQUENCY = 500;
        const xFrequency = Parameters.maxFrequency;
        const baseMaxFrequency = MIN_FREQUENCY * (1 - xFrequency) + MAX_FREQUENCY * xFrequency;
        const frequency = baseMaxFrequency / imageFitting.zoomFactor;
        this.step = 1 / frequency;
    }

    public buildPlotterInfos(): IPlotterInfo {
        return {
            backgroundColor: Parameters.invertColors ? "black" : "white",
            lineColor: Parameters.invertColors ? "white" : "black",
            lineThickness: this.linesThickness,
            roundLinecap: false,
            blur: Parameters.blur,
        };
    }

    public drawLine(lines: LinesBase, lineId: number, image: InputImage, plotter: PlotterBase): void {
        let iPortion = 13 * lineId; // attempt to avoid alignment (that could lead to visual artifacts) in a deterministic way

        lines.walkOnLine(lineId, this.step, (point: IPoint) => {
            const normalizedCoords = this.imageFitting.pixelToRelative(point);

            const outOfImage = normalizedCoords.x < 0 || normalizedCoords.x > 1 || normalizedCoords.y < 0 || normalizedCoords.y > 1;
            if (outOfImage) {
                if (plotter.hasStartedALine) {
                    plotter.endLine();
                }
            } else {
                const localDarkness = clamp(0, 1, this.samplingFunction(image, normalizedCoords));

                const iQuantifiedColor = Math.floor(localDarkness * 0.99 * PatternDithering.ditheringPatterns.length);
                const ditheringPattern = PatternDithering.ditheringPatterns[iQuantifiedColor];
                const isDarkPortion = ditheringPattern[Math.floor(iPortion % ditheringPattern.length)] > 0.5;

                if (isDarkPortion) {
                    if (!plotter.hasStartedALine) {
                        plotter.startLine();
                    }
                    const absolutePoint = this.imageFitting.relativeToAbsolute(point);
                    plotter.addPointToLine(absolutePoint.x, absolutePoint.y);
                } else if (plotter.hasStartedALine) {
                    const absolutePoint = this.imageFitting.relativeToAbsolute(point);
                    plotter.addPointToLine(absolutePoint.x, absolutePoint.y);
                    plotter.endLine();
                }

                iPortion++;
            }
        });

        if (plotter.hasStartedALine) {
            plotter.endLine();
        }
    }

    private static chooseBestSamplingFunction(): SamplingFunction {
        if (Parameters.invertColors) {
            return (inputImage: InputImage, coords: IPoint) => inputImage.sample(coords);
        } else {
            return (inputImage: InputImage, coords: IPoint) => 1 - inputImage.sample(coords);
        }
    }
}

export { PatternDithering };
