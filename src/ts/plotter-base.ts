interface IPlotterInfo {
    backgroundColor: string;
    lineColor: string;
    lineWidth: number;
    blur: number;
}

interface ISize {
    width: number;
    height: number;
}

abstract class PlotterBase {
    public abstract get size(): ISize;

    public abstract initialize(infos: IPlotterInfo): void;
    public abstract finalize(): void;

    public abstract startLine(): void;
    public abstract addPointToLine(x: number, y: number): void;
    public abstract endLine(): void;
}

export { PlotterBase, IPlotterInfo, ISize }
