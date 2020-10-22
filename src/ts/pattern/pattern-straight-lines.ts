import { ISize } from "../interfaces/i-size";
import { IPoint, distance } from "../interfaces/i-point";
import { LineWalker, PatternBase } from "./pattern-base";

import { Parameters } from "../parameters";

interface ILine {
    start: IPoint;
    end: IPoint;
    length: number;
}

enum ELinesOrientation {
    HORIZONTAL,
    VERTICAL,
    DIAGONAL,
}

class PatternStraightLines extends PatternBase {
    private readonly _suggestedImageSize: ISize;

    private readonly _normal: IPoint;
    private readonly _lines: ILine[];

    public constructor(imageSize: ISize, linesSpacing: number) {
        super();

        this._normal = {
            x: -Math.sin(Parameters.orientationInRadians),
            y: Math.cos(Parameters.orientationInRadians),
        };

        let linesOrientation = ELinesOrientation.DIAGONAL;
        if (Parameters.orientationInDegrees % 180 === 90) {
            linesOrientation = ELinesOrientation.VERTICAL;
        } else if (Parameters.orientationInDegrees % 180 === 0) {
            linesOrientation = ELinesOrientation.HORIZONTAL;
        }

        this._lines = [];
        this._lines.push(PatternStraightLines.computeLine(0, linesSpacing, linesOrientation, this._normal, imageSize));

        const maximumLinesNeeded = PatternStraightLines.computeMaximumLinesNeeded(imageSize, linesSpacing);
        const maxAbsLine = maximumLinesNeeded / 2 + 1;
        for (let iAbsLine = 1; iAbsLine < maxAbsLine; iAbsLine++) {
            for (let iSide = -1; iSide <= 2; iSide += 2) {
                const iLine = iAbsLine * iSide;
                const line = PatternStraightLines.computeLine(iLine, linesSpacing, linesOrientation, this._normal, imageSize);

                const ROUNDING_ERROR = 0.1;

                const xOutOfBounds = line.start.x < -ROUNDING_ERROR || line.start.x > imageSize.width - 1 + ROUNDING_ERROR;
                const yOutOfBounds = line.start.y < -ROUNDING_ERROR || line.start.y > imageSize.height - 1 + ROUNDING_ERROR;

                if (xOutOfBounds || yOutOfBounds) {
                    break;
                }

                this._lines.push(line);
            }
        }
        this._suggestedImageSize = PatternStraightLines.computeBestImageSize(imageSize, this._lines.length, linesOrientation);
    }

    public get suggestedImageSize(): ISize {
        return this._suggestedImageSize;
    }

    public get nbLines(): number {
        return this._lines.length;
    }

    public walkOnLine(lineId: number, step: number, callback: LineWalker): void {
        const line = this._lines[lineId];

        function computePoint(completion: number): IPoint {
            return {
                x: line.start.x * (1 - completion) + line.end.x * completion,
                y: line.start.y * (1 - completion) + line.end.y * completion,
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

    private static computeLine(iLine: number, linesSpacing: number, linesOrientation: ELinesOrientation, normal: IPoint, imageSize: ISize): ILine {
        const tangent: IPoint = {
            x: normal.y,
            y: -normal.x,
        };

        const start: IPoint = {
            x: 0.5 * imageSize.width + iLine * linesSpacing * normal.x,
            y: 0.5 * imageSize.height + iLine * linesSpacing * normal.y,
        };
        const end: IPoint = { x: start.x, y: start.y };

        const maxX = imageSize.width - 1;
        const maxY = imageSize.height - 1;

        if (linesOrientation === ELinesOrientation.HORIZONTAL) {
            start.x = 0;
            end.x = maxX;
        } else if (linesOrientation === ELinesOrientation.VERTICAL) {
            start.y = 0;
            end.y = maxY;
        } else {
            const startAdjustment = Math.min(start.x / tangent.x, start.y / tangent.y);
            start.x -= startAdjustment * tangent.x;
            start.y -= startAdjustment * tangent.y;

            const endAdjustment = Math.min((maxX - end.x) / tangent.x, (maxY - end.y) / tangent.y);
            end.x += endAdjustment * tangent.x;
            end.y += endAdjustment * tangent.y;
        }

        return {
            start,
            end,
            length: distance(start, end),
        };
    }

    private static computeBestImageSize(imageSize: ISize, nbLines: number, orientation: ELinesOrientation): ISize {
        if (orientation === ELinesOrientation.HORIZONTAL) {
            return {
                width: imageSize.width,
                height: nbLines,
            };
        } else if (orientation === ELinesOrientation.VERTICAL) {
            return {
                width: nbLines,
                height: imageSize.height,
            };
        }

        return {
            width: imageSize.width,
            height: imageSize.height,
        };
    }

    private static computeMaximumLinesNeeded(imageSize: ISize, linesSpacing: number): number {
        const diagonal = Math.sqrt(imageSize.width * imageSize.width + imageSize.height * imageSize.height)
        return Math.ceil(diagonal / linesSpacing);
    }
}

export { PatternStraightLines }
