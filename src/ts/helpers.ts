import { ISize } from "./interfaces/i-size";
import { Parameters, ELinesType, EPattern } from "./parameters";
import { LinesBase } from "./lines/lines-base";
import { LinesStraightLines } from "./lines/lines-straight-lines";
import { LinesSines } from "./lines/lines-sines";
import { LinesSpiral } from "./lines/lines-spiral";
import { IImageFitting } from "./plotter/plotter-base";
import { LinesPolygon } from "./lines/lines-polygon";
import { PatternWave } from "./pattern/pattern-wave";
import { PatternBase } from "./pattern/pattern-base";
import { PatternDithering } from "./pattern/pattern-dithering";


function chooseLines(imageSizeInPlotter: ISize, linesSpacing: number): LinesBase {
    const chosenType = Parameters.linesType;
    if (chosenType === ELinesType.STRAIGHT) {
        return new LinesStraightLines(imageSizeInPlotter, linesSpacing);
    } else if (chosenType === ELinesType.SPIRAL) {
        return new LinesSpiral(imageSizeInPlotter, linesSpacing);
    } else if (chosenType === ELinesType.POLYGON) {
        return new LinesPolygon(imageSizeInPlotter, linesSpacing);
    } else {
        return new LinesSines(imageSizeInPlotter, linesSpacing);
    }
}

function choosePattern(imageFitting: IImageFitting, linesSpacing: number): PatternBase {
    const pattern = Parameters.pattern;
    if (pattern === EPattern.WAVES) {
        return new PatternWave(imageFitting, linesSpacing);
    } else {
        return new PatternDithering(imageFitting, linesSpacing);
    }
}

function downloadTextFile(content: string, filename: string): void {
    const fileType = "text/plain";

    const blob = new Blob([content], { type: fileType });

    if (typeof window.navigator !== "undefined" && typeof (window.navigator as any).msSaveBlob !== "undefined") { // for IE
        (window.navigator as any).msSaveBlob(blob, filename);
    } else {
        const objectUrl = URL.createObjectURL(blob);

        const linkElement = document.createElement('a');
        linkElement.download = filename;
        linkElement.href = objectUrl;
        linkElement.dataset.downloadurl = `${fileType}:${linkElement.download}:${linkElement.href}`;
        linkElement.style.display = "none";
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);

        // don't forget to free the objectURL after a few seconds
        setTimeout(() => {
            URL.revokeObjectURL(objectUrl);
        }, 5000);
    }
}

export {
    chooseLines,
    choosePattern,
    downloadTextFile,
};
