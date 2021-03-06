import "./page-interface-generated";

const controlId = {
    UPLOAD_INPUT_IMAGE: "input-image-upload-button",
    LINES_TYPE: "lines-type-tabs-id",
    LINES_COUNT: "lines-count-range-id",
    ORIENTATION: "orientation-range-id",
    LINES_SIDES: "lines-sides-range-id",
    LINES_AMPLITUDE: "lines-amplitude-range-id",
    LINES_FREQUENCY: "lines-frequency-range-id",
    PATTERN: "pattern-tabs-id",
    AMPLITUDE: "max-amplitude-range-id",
    FREQUENCY: "max-frequency-range-id",
    ANGLE: "angle-range-id",
    WAVE_SQUARENESS: "wave-squareness-range-id",
    LINE_THICKNESS: "line-thickness-range-id",
    INVERT_COLORS: "invert-colors-checkbox-id",
    BLUR: "blur-range-id",
    DOWNLOAD: "result-download-id",
};

enum ELinesType {
    STRAIGHT = "0",
    SPIRAL = "1",
    POLYGON = "2",
    SINES = "3",
}

enum EPattern {
    WAVES = "0",
    DITHERING = "1",
}

type RedrawObserver = () => unknown;
const redrawObservers: RedrawObserver[] = [];
function triggerRedraw(): void {
    for (const observer of redrawObservers) {
        observer();
    }
}

Page.Tabs.addObserver(controlId.LINES_TYPE, triggerRedraw);
Page.Range.addLazyObserver(controlId.LINES_COUNT, triggerRedraw);
Page.Range.addLazyObserver(controlId.ORIENTATION, triggerRedraw);
Page.Range.addLazyObserver(controlId.LINES_SIDES, triggerRedraw);
Page.Range.addLazyObserver(controlId.LINES_AMPLITUDE, triggerRedraw);
Page.Range.addLazyObserver(controlId.LINES_FREQUENCY, triggerRedraw);
Page.Tabs.addObserver(controlId.PATTERN, triggerRedraw);
Page.Range.addLazyObserver(controlId.AMPLITUDE, triggerRedraw);
Page.Range.addLazyObserver(controlId.FREQUENCY, triggerRedraw);
Page.Range.addLazyObserver(controlId.ANGLE, triggerRedraw);
Page.Range.addLazyObserver(controlId.WAVE_SQUARENESS, triggerRedraw);
Page.Range.addLazyObserver(controlId.LINE_THICKNESS, triggerRedraw);
Page.Checkbox.addObserver(controlId.INVERT_COLORS, triggerRedraw);
Page.Canvas.Observers.canvasResize.push(triggerRedraw);

abstract class Parameters {
    public static addFileUploadObserver(callback: (image: HTMLImageElement) => unknown): void {
        Page.FileControl.addUploadObserver(controlId.UPLOAD_INPUT_IMAGE, (filesList: FileList) => {
            if (filesList.length === 1) {
                Page.Canvas.showLoader(true);
                const reader = new FileReader();
                reader.onload = () => {
                    const image = new Image();
                    image.addEventListener("load", () => {
                        callback(image);
                    })
                    image.src = reader.result as string;
                };
                reader.readAsDataURL(filesList[0]);
            }
        });
    }

    public static get linesType(): ELinesType {
        return Page.Tabs.getValues(controlId.LINES_TYPE)[0] as ELinesType;
    }

    public static get linesCount(): number {
        return Page.Range.getValue(controlId.LINES_COUNT);
    }

    public static get orientationInDegrees(): number {
        return Page.Range.getValue(controlId.ORIENTATION);
    }
    public static get orientationInRadians(): number {
        return this.orientationInDegrees / 180 * Math.PI;
    }

    public static get linesSides(): number {
        return Page.Range.getValue(controlId.LINES_SIDES);
    }

    public static get linesAmplitude(): number {
        return Page.Range.getValue(controlId.LINES_AMPLITUDE);
    }

    public static get linesFrequency(): number {
        return Page.Range.getValue(controlId.LINES_FREQUENCY);
    }

    public static get pattern(): EPattern {
        return Page.Tabs.getValues(controlId.PATTERN)[0] as EPattern;
    }

    public static get maxAmplitude(): number {
        return Page.Range.getValue(controlId.AMPLITUDE);
    }

    public static get maxFrequency(): number {
        return Page.Range.getValue(controlId.FREQUENCY);
    }

    public static get angle(): number {
        return Page.Range.getValue(controlId.ANGLE);
    }

    public static get waveSquareness(): number {
        return Page.Range.getValue(controlId.WAVE_SQUARENESS);
    }

    public static get lineThickness(): number {
        return Page.Range.getValue(controlId.LINE_THICKNESS);
    }

    public static get invertColors(): boolean {
        return Page.Checkbox.isChecked(controlId.INVERT_COLORS);
    }

    public static addRedrawObserver(callback: RedrawObserver): void {
        redrawObservers.push(callback);
    }

    public static get blur(): number {
        return Page.Range.getValue(controlId.BLUR);
    }
    public static addBlurChangeObserver(callback: (newBlur: number) => unknown): void {
        Page.Range.addObserver(controlId.BLUR, callback);
    }

    public static addDownloadObserver(callback: () => unknown): void {
        Page.FileControl.addDownloadObserver(controlId.DOWNLOAD, callback);
    }
}

function udpateControlsVisibility(): void {
    Page.Controls.setVisibility(controlId.PATTERN, false);

    const type = Parameters.linesType;
    Page.Controls.setVisibility(controlId.LINES_SIDES, type === ELinesType.POLYGON);
    Page.Controls.setVisibility(controlId.LINES_AMPLITUDE, type === ELinesType.SINES);
    Page.Controls.setVisibility(controlId.LINES_FREQUENCY, type === ELinesType.SINES);

    const pattern = Parameters.pattern;
    Page.Controls.setVisibility(controlId.ANGLE, pattern === EPattern.WAVES);
    Page.Controls.setVisibility(controlId.WAVE_SQUARENESS, pattern === EPattern.WAVES);
    Page.Controls.setVisibility(controlId.LINE_THICKNESS, pattern === EPattern.WAVES);
}
Page.Tabs.addObserver(controlId.LINES_TYPE, udpateControlsVisibility);
Page.Tabs.addObserver(controlId.PATTERN, udpateControlsVisibility);
udpateControlsVisibility();

let lastAmplitude: number | null = null;
let lastFrequency: number | null = null;
Page.Tabs.addObserver(controlId.PATTERN, function updateControlsValue(): void {
    const pattern = Parameters.pattern;

    const previousAmplitude = Page.Range.getValue(controlId.AMPLITUDE);
    const previousFrequency = Page.Range.getValue(controlId.FREQUENCY);

    let newAmplitude = lastAmplitude;
    let newFrequency = lastFrequency;
    if (pattern === EPattern.WAVES) {
        newAmplitude = (newAmplitude === null) ? 1 : newAmplitude;
        newFrequency = (newFrequency === null) ? 0.4 : newFrequency;
    } else if (pattern === EPattern.DITHERING) {
        newAmplitude = (newAmplitude === null) ? 0.5 : newAmplitude;
        newFrequency = (newFrequency === null) ? 0.5 : newFrequency;
    }

    Page.Range.setValue(controlId.AMPLITUDE, newAmplitude);
    Page.Range.setValue(controlId.FREQUENCY, newFrequency);
    lastAmplitude = previousAmplitude;
    lastFrequency = previousFrequency;

    triggerRedraw();
});

export { Parameters, ELinesType, EPattern }
