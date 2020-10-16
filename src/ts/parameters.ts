import "./page-interface-generated";

const controlId = {
    UPLOAD_INPUT_IMAGE: "input-image-upload-button",
    VERTICAL_RESOLUTION: "vertical-resolution-range-id",
    AMPLITUDE: "max-amplitude-range-id",
    FREQUENCY: "max-frequency-range-id",
    ANGLE: "angle-range-id",
    LINE_WIDTH: "line-width-range-id",
    INVERT_COLORS: "invert-colors-checkbox-id",
    BLUR: "blur-range-id",
    TRUE_INTENSITY: "true-intensity-checkbox-id",
    DOWNLOAD: "result-download-id",
};

type RedrawObserver = () => unknown;
const redrawObservers: RedrawObserver[] = [];
function triggerRedraw(): void {
    for (const observer of redrawObservers) {
        observer();
    }
}

Page.Range.addLazyObserver(controlId.VERTICAL_RESOLUTION, triggerRedraw);
Page.Range.addLazyObserver(controlId.AMPLITUDE, triggerRedraw);
Page.Range.addLazyObserver(controlId.FREQUENCY, triggerRedraw);
Page.Range.addLazyObserver(controlId.ANGLE, triggerRedraw);
Page.Range.addLazyObserver(controlId.LINE_WIDTH, triggerRedraw);
Page.Checkbox.addObserver(controlId.INVERT_COLORS, triggerRedraw);
Page.Checkbox.addObserver(controlId.TRUE_INTENSITY, triggerRedraw);
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

    public static get verticalResolution(): number {
        return Page.Range.getValue(controlId.VERTICAL_RESOLUTION);
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

    public static get lineWidth(): number {
        return Page.Range.getValue(controlId.LINE_WIDTH);
    }

    public static get invertColors(): boolean {
        return Page.Checkbox.isChecked(controlId.INVERT_COLORS);
    }

    public static get trueIntensity(): boolean {
        return Page.Checkbox.isChecked(controlId.TRUE_INTENSITY);
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

export { Parameters }
