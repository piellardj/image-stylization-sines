import { ISize } from "../interfaces/i-size";
import { IPoint } from "../interfaces/i-point";
import { LineWalker, PatternBase } from "./pattern-base";

import { Parameters } from "../parameters";

interface ILine {
    start: IPoint;
    end: IPoint;
    length: number;
}

class PatternSines extends PatternBase {
    private readonly _suggestedImageSize: ISize;

    private readonly _normal: IPoint;
    private readonly _lines: ILine[];
    private readonly _frequency: number;
    private readonly _amplitude: number;

    public constructor(imageSize: ISize, linesSpacing: number) {
        super();

        this._frequency = Parameters.linesFrequency;
        this._amplitude = Parameters.linesAmplitude * 0.2 * Math.max(imageSize.width, imageSize.height);

        this._normal = {
            x: -Math.sin(Parameters.orientationInRadians),
            y: Math.cos(Parameters.orientationInRadians),
        };

        this._lines = [];
        this._lines.push(PatternSines.computeLine(0, linesSpacing, this._normal, imageSize));

        const maximumLinesNeeded = this.computeMaximumLinesNeeded(imageSize, linesSpacing);
        const maxAbsLine = maximumLinesNeeded / 2 + 1;
        for (let iAbsLine = 1; iAbsLine < maxAbsLine; iAbsLine++) {
            for (let iSide = -1; iSide <= 2; iSide += 2) {
                const iLine = iAbsLine * iSide;
                const line = PatternSines.computeLine(iLine, linesSpacing, this._normal, imageSize);
                this._lines.push(line);
            }
        }
        this._suggestedImageSize = { width: imageSize.width, height: imageSize.height };
    }

    public get suggestedImageSize(): ISize {
        return this._suggestedImageSize;
    }

    public get nbLines(): number {
        return this._lines.length;
    }

    public walkOnLine(lineId: number, step: number, callback: LineWalker): void {
        const line = this._lines[lineId];

        const computePoint = (completion: number): IPoint => {
            const wave = this._amplitude * Math.sin(2 * Math.PI * completion * this._frequency);
            return {
                x: line.start.x * (1 - completion) + line.end.x * completion + wave * this._normal.x,
                y: line.start.y * (1 - completion) + line.end.y * completion + wave * this._normal.y,
            };
        }

        const maxNbSteps = line.length / step;
        for (let iStep = 0; iStep < maxNbSteps; iStep++) {
            const completion = (iStep * step) / line.length;

            const point = computePoint(completion);
            callback(point, this._normal);
        }

        const lastPoint = computePoint(1);
        callback(lastPoint, this._normal);
    }

    private static computeLine(iLine: number, linesSpacing: number, normal: IPoint, imageSize: ISize): ILine {
        const lineLength = Math.sqrt(imageSize.width * imageSize.width + imageSize.height * imageSize.height);
        const tangent: IPoint = {
            x: normal.y,
            y: -normal.x,
        };

        const center: IPoint = {
            x: 0.5 * imageSize.width + iLine * linesSpacing * normal.x,
            y: 0.5 * imageSize.height + iLine * linesSpacing * normal.y,
        };

        const start: IPoint = {
            x: center.x - 0.5 * lineLength * tangent.x,
            y: center.y - 0.5 * lineLength * tangent.y,
        };

        const end: IPoint = {
            x: center.x + 0.5 * lineLength * tangent.x,
            y: center.y + 0.5 * lineLength * tangent.y,
        };

        return {
            start,
            end,
            length: lineLength, // this is not mathematically accurate
        };
    }

    private computeMaximumLinesNeeded(imageSize: ISize, linesSpacing: number): number {
        const width = imageSize.width + 2 * this._amplitude;
        const height = imageSize.height + 2 * this._amplitude;

        const diagonal = Math.sqrt(width * width + height * height);
        return Math.ceil(diagonal / linesSpacing);
    }
}

export { PatternSines }
