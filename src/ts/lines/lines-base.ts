import { IPoint } from "../interfaces/i-point";
import { ISize } from "../interfaces/i-size";

type LineWalker = (point: IPoint, normal: IPoint) => unknown;

abstract class LinesBase {
    /** Returns the suggested image size for optimum quality */
    public abstract get suggestedImageSize(): ISize;
    public abstract get nbLines(): number;

    /**
     * @param lineId integer
     * @param step in canvas pixels
     */
    public abstract walkOnLine(lineId: number, step: number, callback: LineWalker): void;
}

export { LineWalker, LinesBase }
