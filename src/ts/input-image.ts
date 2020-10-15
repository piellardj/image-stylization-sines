class InputImage {
    private _width: number;
    private _height: number;

    private readonly hiddenCanvas: HTMLCanvasElement;
    private readonly hiddenContext: CanvasRenderingContext2D;
    private readonly sourceImage: HTMLImageElement;
    private valueArray: Uint8ClampedArray;

    public constructor(image: HTMLImageElement) {
        this.hiddenCanvas = document.createElement("canvas");
        this.hiddenContext = this.hiddenCanvas.getContext("2d");
        this.sourceImage = image;
        this._width = 0;
        this._height = 0;
    }

    public get width(): number {
        return this._width;
    }

    public get height(): number {
        return this._height;
    }

    public get sourceImageAspectRatio(): number {
        return this.sourceImage.width / this.sourceImage.height;
    }

    public resize(maxWidth: number, height: number): void {
        // the canvas handles image downsizing, however upsizing is handled manually in the sample method.
        const wantedWidth = Math.min(this.sourceImage.width, maxWidth);
        const wantedHeight = height;

        if (this._width !== wantedWidth || this._height !== wantedHeight) {
            console.log(`Resize image from ${this._width}x${this._height} to ${wantedWidth}x${wantedHeight}.`);

            this._width = wantedWidth;
            this._height = wantedHeight;

            this.hiddenCanvas.width = this.width;
            this.hiddenCanvas.height = this.height;
            this.hiddenContext.drawImage(this.sourceImage, 0, 0, this.width, this.height);

            // retrieve all pixels at once because it is way faster that 1 by 1
            const fullPixelsArray = this.hiddenContext.getImageData(0, 0, this.width, this.height).data;
            this.valueArray = new Uint8ClampedArray(this.width * this.height);

            for (let i = 0; i < this.valueArray.length; i++) {
                const r = fullPixelsArray[4 * i];
                const g = fullPixelsArray[4 * i + 1];
                const b = fullPixelsArray[4 * i + 2];
                this.valueArray[i] = (r + g + b) / 3;
            }
        }
    }

    /** Returns a value in [0, 1].
     * Performs linear interpolation on the x component.
     * @param x can be decimal, interpolation will be performed.
     * @param y must be an integer
     */
    public sample(x: number, y: number): number {
        const floorX = Math.floor(x);
        const fractX = x - floorX;

        const before = this.getPixel(floorX, y);
        const after = this.getPixel(floorX + 1, y);
        const interpolated = before * (1 - fractX) + after * fractX;

        return interpolated / 255;
    }

    /** Returns a value in [0, 255].
     * No interpolation.
     * @param x must be an integer
     * @param y must be an integer
     */
    private getPixel(x: number, y: number): number {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
            return 0;
        }

        return this.valueArray[y * this.width + x];
    }
}

export { InputImage }
