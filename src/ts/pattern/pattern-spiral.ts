import { IPoint } from "../interfaces/i-point";
import { ISize } from "../interfaces/i-size";
import { Parameters } from "../parameters";
import { LineWalker, PatternBase } from "./pattern-base";

class PatternSpiral extends PatternBase {
    private readonly _center: IPoint;
    private readonly _suggestedImageSize: ISize;
    private readonly _radiusGap: number;
    private readonly _maxAngle: number;

    public constructor(imageSize: ISize, linesSpacing: number) {
        super();

        this._center = {
            x: 0.5 * imageSize.width,
            y: 0.5 * imageSize.height,
        };

        this._suggestedImageSize = {
            width: imageSize.width,
            height: imageSize.height,
        };

        this._radiusGap = 0.5 * linesSpacing;

        const diagonal = Math.sqrt(imageSize.width * imageSize.width + imageSize.height * imageSize.height);
        const nbSemiCircles = Math.ceil(diagonal / linesSpacing);
        this._maxAngle = nbSemiCircles * Math.PI;
    }

    public get suggestedImageSize(): ISize {
        return this._suggestedImageSize;
    }

    public get nbLines(): number {
        return 1;
    }

    public walkOnLine(_lineId: number, step: number, callback: LineWalker): void {
        const orientation = Parameters.orientationInRadians;
        const cosOrientation = Math.cos(orientation);
        const sinOrientation = Math.sin(orientation);

        let angle = 0;
        while (angle < this._maxAngle) {
            const cosAngle = Math.cos(angle);
            const sinAngle = Math.sin(angle);

            const semiCircleId = Math.ceil((angle - orientation) / Math.PI);
            const radius = (semiCircleId + 0.125) * this._radiusGap;
            const centerOffset = this._radiusGap * (0.5 - (semiCircleId % 2));

            const point: IPoint = {
                x: this._center.x + centerOffset * cosOrientation + radius * cosAngle,
                y: this._center.y + centerOffset * sinOrientation + radius * sinAngle,
            };
            const normal: IPoint = {
                x: -cosAngle,
                y: -sinAngle,
            };

            callback(point, normal);

            angle += step / radius;
        }
    }
}

export { PatternSpiral }
