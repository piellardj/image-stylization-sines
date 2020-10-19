import { ISize } from "../interfaces/i-size";
import { IPoint } from "../interfaces/i-point";
import { LineWalker, PatternBase } from "./pattern-base";

class PatternStraightLines extends PatternBase {
    private readonly _wantedImageSize: ISize;
    private readonly _nbLines: number;
    private readonly _startX: number;
    private readonly _endX: number;

    public constructor(imageSize: ISize, plotterSize: ISize, nbLines: number) {
        super();

        this._wantedImageSize = {
            width: Math.min(imageSize.width, plotterSize.width),
            height: nbLines,
        };
        this._nbLines = nbLines;
        this._startX = 0;
        this._endX = imageSize.width - 1;
    }

    public get wantedImageSize(): ISize {
        return this._wantedImageSize;
    }

    public get nbLines(): number {
        return this._nbLines;
    }

    public walkOnLine(lineId: number, step: number, callback: LineWalker): void {
        const normal: IPoint = {
            x: 0,
            y: 1,
        };

        const start = this._startX;
        const end = this._endX;
        function computePoint(completion: number): IPoint {
            return {
                x: start * (1 - completion) + end * completion,
                y: lineId,
            };
        }

        const lineLength = end - start;

        const maxNbSteps = lineLength / step;
        for (let iStep = 0; iStep < maxNbSteps; iStep++) {
            const completion = (iStep * step) / lineLength;

            const point = computePoint(completion);
            callback(point, normal);
        }

        const lastPoint = computePoint(1);
        callback(lastPoint, normal);
    }
}

export { PatternStraightLines }
