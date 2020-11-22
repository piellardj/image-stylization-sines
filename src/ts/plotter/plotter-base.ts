import { IPoint } from "../interfaces/i-point";
import { ISize } from "../interfaces/i-size";

interface IPlotterInfo {
    backgroundColor: string;
    lineColor: string;
    lineThickness: number;
    blur: number;
}

interface IImageFitting {
    sizeInPlotter: ISize,
    relativeToAbsolute: (relativeCoords: IPoint) => IPoint;
    zoomFactor: number,
};

const ANGLE_THRESHOLD = Math.PI * 0.01;

abstract class PlotterBase {
    public abstract initialize(infos: IPlotterInfo): void;
    public abstract finalize(): void;

    public get hasStartedALine(): boolean {
        return this._hasStartedALine;
    }

    public startLine(): void {
        this._hasStartedALine = true;
        this.startLineInternal();

        this.lastDrawnPoint = null;
        this.potentialNextPoint = null;
    }

    public addPointToLine(x: number, y: number): void {
        const newPoint: IPoint = { x, y };

        if (this.lastDrawnPoint === null) {
            this.lastDrawnPoint = newPoint;
            this.addFirstPointToLineInternal(this.lastDrawnPoint.x, this.lastDrawnPoint.y);
        } else if (this.potentialNextPoint === null) {
            this.potentialNextPoint = newPoint;
        } else {
            const angle = PlotterBase.computeAngle(this.lastDrawnPoint, this.potentialNextPoint, newPoint);

            if (angle > ANGLE_THRESHOLD) {
                this.addPointToLineInternal(this.potentialNextPoint.x, this.potentialNextPoint.y); // this point cannot be skipped because it defines a significant angle
                this.lastDrawnPoint = this.potentialNextPoint;
            }
            this.potentialNextPoint = newPoint;
        }
    }

    public endLine(): void {
        if (this.potentialNextPoint !== null) {
            this.addPointToLineInternal(this.potentialNextPoint.x, this.potentialNextPoint.y);
        }
        this.lastDrawnPoint = null;
        this.potentialNextPoint = null;

        this.endLineInternal();
        this._hasStartedALine = false;
    }

    public fitImage(imageAspectRatio: number): IImageFitting {
        const plotterSize = this.size;
        const displayAspectRatio = plotterSize.width / plotterSize.height;

        const sizeInPlotter: ISize = {
            width: plotterSize.width,
            height: plotterSize.height,
        };
        if (imageAspectRatio > displayAspectRatio) {
            sizeInPlotter.height = Math.floor(sizeInPlotter.height * displayAspectRatio / imageAspectRatio);
        } else if (imageAspectRatio < displayAspectRatio) {
            sizeInPlotter.width = Math.floor(sizeInPlotter.width * imageAspectRatio / displayAspectRatio);
        }

        const offSetX = 0.5 * (plotterSize.width - sizeInPlotter.width);
        const offSetY = 0.5 * (plotterSize.height - sizeInPlotter.height);
        const relativeToAbsolute = (relativeCoords: IPoint): IPoint => {
            return {
                x: relativeCoords.x + offSetX,
                y: relativeCoords.y + offSetY,
            };
        };

        const minSide = Math.min(sizeInPlotter.width, sizeInPlotter.height);
        const baseMinSide = Math.min(imageAspectRatio, 1 / imageAspectRatio);

        return {
            sizeInPlotter,
            relativeToAbsolute,
            zoomFactor: minSide / baseMinSide,
        };
    }

    protected abstract get size(): ISize;
    protected abstract startLineInternal(): void;
    protected abstract addFirstPointToLineInternal(x: number, y: number): void;
    protected abstract addPointToLineInternal(x: number, y: number): void;
    protected abstract endLineInternal(): void;

    /** Smallest absolute angle difference between vectors p2-p1 and p3-p2 */
    private static computeAngle(p1: IPoint, p2: IPoint, p3: IPoint): number {
        const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x); // in [-PI,PI] (warped)
        const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x); // in [-PI,PI] (warped)

        const diffAngle = Math.abs(angle1 - angle2); // in [0, 2 * PI] (warped)
        return Math.min(diffAngle, 2 * Math.PI - diffAngle);
    }

    private lastDrawnPoint: IPoint;
    private potentialNextPoint: IPoint;
    private _hasStartedALine: boolean = false;
}

export { PlotterBase, IPlotterInfo, ISize }
