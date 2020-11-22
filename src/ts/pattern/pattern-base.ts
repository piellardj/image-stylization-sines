import { InputImage } from "../input-image";
import { LinesBase } from "../lines/lines-base";
import { IPlotterInfo, PlotterBase } from "../plotter/plotter-base";

abstract class PatternBase {
    public abstract buildPlotterInfos(): IPlotterInfo;
    public abstract drawLine(lines: LinesBase, lineId: number, image: InputImage, plotter: PlotterBase): void;
}

export { PatternBase };
