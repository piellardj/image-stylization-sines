import { InputImage } from "../input-image";
import { IPoint } from "../interfaces/i-point";
import { LinesBase } from "../lines/lines-base";
import { Parameters } from "../parameters";
import { PlotterBase, IImageFitting, IPlotterInfo } from "../plotter/plotter-base";
import { PatternBase } from "./pattern-base";

type WaveFunction = (phase: number, amplitude: number) => number;
type NormalRotationFunction = (normal: IPoint) => IPoint;
type SamplingFunction = (inputImage: InputImage, coords: IPoint) => number;

class PatternWave extends PatternBase {
    private readonly waveFunction: WaveFunction;
    private readonly normalRotationFunction: NormalRotationFunction;
    private readonly samplingFunction: SamplingFunction;

    private readonly imageFitting: IImageFitting;

    private readonly maxAmplitude: number;
    private readonly maxFrequency: number;
    private readonly step: number;

    public constructor(imageFitting: IImageFitting, linesSpacing: number) {
        super();

        this.waveFunction = PatternWave.computeWaveFunction();
        this.normalRotationFunction = PatternWave.computeNormalRotationFunction();
        this.samplingFunction = PatternWave.chooseBestSamplingFunction();

        this.imageFitting = imageFitting;

        const baseMaxFrequency = 2500 * Parameters.maxFrequency;
        this.maxFrequency = baseMaxFrequency / imageFitting.zoomFactor;

        this.maxAmplitude = 0.5 * (linesSpacing - Parameters.lineThickness) * Parameters.maxAmplitude;

        const samplesPerPixel = Math.max(1, 2 * this.maxFrequency);
        this.step = 1 / samplesPerPixel;
    }

    public buildPlotterInfos(): IPlotterInfo {
        return {
            backgroundColor: Parameters.invertColors ? "black" : "white",
            lineColor: Parameters.invertColors ? "white" : "black",
            lineThickness: Parameters.lineThickness,
            blur: Parameters.blur,
        };
    }

    public drawLine(lines: LinesBase, lineId: number, image: InputImage, plotter: PlotterBase): void {
        let phase = 0;

        lines.walkOnLine(lineId, this.step, (point: IPoint, normal: IPoint) => {
            const normalizedCoords = this.imageFitting.pixelToRelative(point);

            const outOfImage = normalizedCoords.x < 0 || normalizedCoords.x > 1 || normalizedCoords.y < 0 || normalizedCoords.y > 1;
            if (outOfImage) {
                if (plotter.hasStartedALine) {
                    plotter.endLine();
                }
            } else {
                const localDarkness = this.samplingFunction(image, normalizedCoords);

                const localAmplitude = localDarkness * this.maxAmplitude;
                const localHeight = this.waveFunction(phase, localAmplitude);

                const rotatedNormal = this.normalRotationFunction(normal);
                const dX = localHeight * rotatedNormal.x;
                const dY = localHeight * rotatedNormal.y;

                const absolutePoint = this.imageFitting.relativeToAbsolute(point);
                if (!plotter.hasStartedALine) {
                    plotter.startLine();
                }
                plotter.addPointToLine(absolutePoint.x + dX, absolutePoint.y + dY);

                const localFrequency = localDarkness * this.maxFrequency;
                phase += localFrequency * this.step;
            }
        });

        if (plotter.hasStartedALine) {
            plotter.endLine();
        }
    }

    private static computeNormalRotationFunction(): NormalRotationFunction {
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

    private static computeWaveFunction(): WaveFunction {
        if (Parameters.waveSquareness < 0.005) {
            return (phase: number, amplitude: number) => amplitude * Math.sin(phase);
        }

        const sharpness = 1 - 0.99 * Parameters.waveSquareness;
        return (phase: number, amplitude: number) => {
            const sinPhase = Math.sin(phase);
            return amplitude * Math.sign(sinPhase) * Math.pow(Math.abs(sinPhase), sharpness);
        };
    }

    private static chooseBestSamplingFunction(): SamplingFunction {
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
}


export { PatternWave };
