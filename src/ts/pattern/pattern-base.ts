import { InputImage } from "../input-image";
import { LinesBase } from "../lines/lines-base";
import { PlotterBase } from "../plotter/plotter-base";

abstract class PatternBase {
    public abstract drawLine(lines: LinesBase, lineId: number, image: InputImage, plotter: PlotterBase): void;
}

export { PatternBase };
