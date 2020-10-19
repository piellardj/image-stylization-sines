import { PlotterBase, IPlotterInfo, ISize } from "./plotter-base";

import "../page-interface-generated";

class PlotterCanvas2D extends PlotterBase {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly cssPixel: number;

    public constructor() {
        super();

        this.canvas = Page.Canvas.getCanvas();
        this.context = this.canvas.getContext("2d", { alpha: false });
        this.cssPixel = window.devicePixelRatio ?? 1;
    }

    public get size(): ISize {
        return {
            width: Math.floor(this.canvas.width / this.cssPixel),
            height: Math.floor(this.canvas.height / this.cssPixel),
        };
    }

    public initialize(infos: IPlotterInfo): void {
        this.resizeCanvas();

        this.context.fillStyle = infos.backgroundColor;
        this.context.strokeStyle = infos.lineColor;
        this.context.lineWidth = infos.lineWidth * this.cssPixel;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // tslint:disable-next-line:no-empty
    public finalize(): void { }

    public set blur(value: number) {
        if (value === 0) {
            this.canvas.style.filter = "";
        } else {
            this.canvas.style.filter = `blur(${value}px)`;
        }
    }

    protected startLineInternal(): void {
        this.context.beginPath();
    }

    protected addFirstPointToLineInternal(rawX: number, rawY: number): void {
        const x = rawX * this.cssPixel;
        const y = rawY * this.cssPixel;
        this.context.moveTo(x, y);
    }

    protected addPointToLineInternal(rawX: number, rawY: number): void {
        const x = rawX * this.cssPixel;
        const y = rawY * this.cssPixel;
        this.context.lineTo(x, y);
    }

    protected endLineInternal(): void {
        this.context.stroke();
        this.context.closePath();
    }

    private resizeCanvas(): void {
        const actualWidth = Math.floor(this.cssPixel * this.canvas.clientWidth);
        const actualHeight = Math.floor(this.cssPixel * this.canvas.clientHeight);

        if (this.canvas.width !== actualWidth || this.canvas.height !== actualHeight) {
            this.canvas.width = actualWidth;
            this.canvas.height = actualHeight;
        }
    }
}

export { PlotterCanvas2D }
