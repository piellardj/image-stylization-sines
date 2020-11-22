import { distance, IPoint } from "../interfaces/i-point";
import { ISize } from "../interfaces/i-size";
import { Parameters } from "../parameters";
import { LineWalker, LinesBase } from "./lines-base";

class LinesPolygon extends LinesBase {
    private readonly _center: IPoint;
    private readonly _suggestedImageSize: ISize;
    private readonly _linesSpacing: number;
    private readonly _maxSegments: number;
    private readonly _nbSides: number;

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

        this._linesSpacing = linesSpacing;
        this._nbSides = Parameters.linesSides;

        const diagonal = Math.sqrt(imageSize.width * imageSize.width + imageSize.height * imageSize.height);
        this._maxSegments = Math.ceil(this._nbSides * diagonal / linesSpacing);
    }

    public get suggestedImageSize(): ISize {
        return this._suggestedImageSize;
    }

    public get nbLines(): number {
        return 1;
    }

    public walkOnLine(_lineId: number, step: number, callback: LineWalker): void {
        const insideAngle = Math.PI * (this._nbSides - 2) / this._nbSides; // inside angle of a regular polygon
        const dSideLength = 2 * this._linesSpacing / Math.tan(insideAngle / 2) / this._nbSides;
        const startSideLength = 0.5 * dSideLength;

        const orientationAngle = Parameters.orientationInRadians;
        const cosOrientation = Math.cos(orientationAngle);
        const sinOrientation = Math.sin(orientationAngle);

        let startPoint: IPoint = {
            x: this._center.x,
            y: this._center.y,
        };
        for (let iSide = 0; iSide < this._maxSegments; iSide++) {
            const sideLength = startSideLength + iSide * dSideLength;
            const tangentAngle = Math.PI + (iSide % this._nbSides) * 2 * Math.PI / this._nbSides;

            const endPoint: IPoint = {
                x: startPoint.x + sideLength * Math.cos(tangentAngle),
                y: startPoint.y + sideLength * Math.sin(tangentAngle),
            };

            const normalAngle = tangentAngle + orientationAngle + Math.PI / 2;
            const normal: IPoint = { x: Math.cos(normalAngle), y: Math.sin(normalAngle) };

            const segmentLength = distance(startPoint, endPoint);
            for (let iSubstep = 0; iSubstep * step < segmentLength; iSubstep++) {
                const currentLength = iSubstep * step;
                const progression = currentLength / segmentLength;

                const rawPointX = startPoint.x * (1 - progression) + endPoint.x * progression - this._center.x;
                const rawPointY = startPoint.y * (1 - progression) + endPoint.y * progression - this._center.y;

                const point: IPoint = {
                    x: cosOrientation * rawPointX - sinOrientation * rawPointY + this._center.x,
                    y: sinOrientation * rawPointX + cosOrientation * rawPointY + this._center.y,
                };
                callback(point, normal);
            }

            startPoint = endPoint;
        }
    }
}

export { LinesPolygon };
