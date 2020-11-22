import { PlotterBase, IPlotterInfo, ISize } from "./plotter-base";

const WIDTH = 1000;
const HEIGHT = 1000;

class PlotterSVG extends PlotterBase {
    private stringParts: string[];
    private hasBlur: boolean;

    public constructor() {
        super();
    }

    // tslint:disable-next-line:no-empty
    public resize(): void {
    }

    public initialize(infos: IPlotterInfo): void {
        this.hasBlur = infos.blur > 0;

        this.stringParts = [];

        this.stringParts.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n`);
        this.stringParts.push(`<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${WIDTH} ${HEIGHT}">\n`);

        if (this.hasBlur) {
            const blurEffectId = "gaussianBlur";

            this.stringParts.push(`\t<defs>\n`);
            this.stringParts.push(`\t\t<filter id="${blurEffectId}" x="0" y="0">\n`);
            this.stringParts.push(`\t\t\t<feGaussianBlur in="SourceGraphic" stdDeviation="${infos.blur}"/>\n`);
            this.stringParts.push(`\t\t</filter>\n`);
            this.stringParts.push(`\t</defs>\n`);
            this.stringParts.push(`\t<g filter="url(#${blurEffectId})">\n`);
        }

        this.stringParts.push(`\t<rect fill="${infos.backgroundColor}" stroke="none" x="0" y="0" width="${WIDTH}" height="${HEIGHT}"/>\n`);
        const linecap = infos.roundLinecap ? ` stroke-linecap="round"` : ``;
        this.stringParts.push(`\t<g fill="none" stroke="${infos.lineColor}" stroke-width="${infos.lineThickness}" stroke-linejoin="round"${linecap}>\n`);
    }

    public finalize(): void {
        if (this.hasBlur) {
            this.stringParts.push(`\t\t</g>\n`);
        }

        this.stringParts.push(`\t</g>\n`);
        this.stringParts.push(`</svg>\n`);
    }

    public endLineInternal(): void {
        this.stringParts.push(`"/>\n`);
    }

    public export(): string {
        const start = Date.now();
        const result = this.stringParts.join("");
        console.log(`Concatenation took ${Date.now() - start} ms.`);
        return result;
    }

    protected get size(): ISize {
        return {
            width: WIDTH,
            height: HEIGHT,
        };
    }

    protected startLineInternal(): void {
        this.stringParts.push(`\t\t<path d="`);
    }

    protected addFirstPointToLineInternal(rawX: number, rawY: number): void {
        const x = rawX.toFixed(1);
        const y = rawY.toFixed(1);
        this.stringParts.push(`M${x},${y}L`);
    }

    protected addPointToLineInternal(rawX: number, rawY: number): void {
        const x = rawX.toFixed(1);
        const y = rawY.toFixed(1);
        this.stringParts.push(`${x},${y} `);
    }
}

export { PlotterSVG }
