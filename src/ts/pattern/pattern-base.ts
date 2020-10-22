import { IPoint } from "../interfaces/i-point";
import { ISize } from "../interfaces/i-size";

type LineWalker = (point: IPoint, normal: IPoint) => unknown;

abstract class PatternBase {
    /** Returns the suggested image size for optimum quality */
    public abstract get suggestedImageSize(): ISize;
    public abstract get nbLines(): number;

    public abstract walkOnLine(lineId: number, step: number, callback: LineWalker): void;
}

export { LineWalker, PatternBase }
