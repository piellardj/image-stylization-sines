import { PlotterBase, IPlotterInfo, ISize } from "./plotter-base";

import "./page-interface-generated";

class PlotterCanvas2D extends PlotterBase {
    private readonly canvas: HTMLCanvasElement;
    private readonly context: CanvasRenderingContext2D;
    private readonly cssPixel: number;

    private newLine: boolean;

    public constructor() {
        super();

        this.canvas = Page.Canvas.getCanvas();
        this.context = this.canvas.getContext("2d");
        this.cssPixel = window.devicePixelRatio ?? 1;
    }

    public get size(): ISize {
        return {
            width: this.canvas.width / this.cssPixel,
            height: this.canvas.height / this.cssPixel,
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

    public startLine(): void {
        this.context.beginPath();
        this.newLine = true;
    }

    public addPointToLine(rawX: number, rawY: number): void {
        const x = rawX * this.cssPixel;
        const y = rawY * this.cssPixel;

        if (this.newLine) {
            this.context.moveTo(x, y);
            this.newLine = false;
        } else {
            this.context.lineTo(x, y);
        }
    }

    public endLine(): void {
        this.context.stroke();
        this.context.closePath();
    }

    public set blur(value: number) {
        if (value === 0) {
            this.canvas.style.filter = "";
        } else {
            this.canvas.style.filter = `blur(${value}px)`;
        }
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
