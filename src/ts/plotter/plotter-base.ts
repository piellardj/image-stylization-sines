import { IPoint } from "../interfaces/i-point";
import { ISize } from "../interfaces/i-size";

interface IPlotterInfo {
    backgroundColor: string;
    lineColor: string;
    lineThickness: number;
    blur: number;
}

const ANGLE_THRESHOLD = Math.PI * 0.01;

abstract class PlotterBase {
    public abstract get size(): ISize;

    public abstract initialize(infos: IPlotterInfo): void;
    public abstract finalize(): void;

    public startLine(): void {
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
    }

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
}

export { PlotterBase, IPlotterInfo, ISize }
