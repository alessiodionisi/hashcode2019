"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
function parseFile(file) {
    let photos = fs_1.default.readFileSync(file, 'utf-8').split('\n');
    let numPhotos = parseInt(photos.shift() || '0');
    if (photos.length > numPhotos)
        photos.pop();
    return photos.map((str, i) => {
        let d = str.split(' ');
        const isV = d.shift() === 'V';
        d.shift();
        const tags = d;
        return { id: i, isV, tags };
    });
}
function createPhotoLists(photos) {
    let hList = [];
    let vList = [];
    for (const photo of photos) {
        if (photo.isV)
            vList.push(photo);
        else
            hList.push(photo);
    }
    return [hList, vList];
}
function createHSlides(hList) {
    let hSlides = [];
    hList.forEach(function (photo, i, a) {
        hSlides.push({ a: photo });
    });
    return hSlides;
}
function createVSlides(vList) {
    let vSlides = [];
    for (let i = 0; i < vList.length; i += 2) {
        vSlides.push({ a: vList[i], b: vList[i + 1] });
    }
    return vSlides;
}
function createSlideshow(photos) {
    const [hList, vList] = createPhotoLists(photos);
    return createVSlides(vList).concat(createHSlides(hList));
}
function score(slides) {
    let total = 0;
    for (let i = 0; i < slides.length - 1; i++) {
        total += compare(slides[i], slides[i + 1]);
    }
    return total;
}
function compare(a, b) {
    let aN = 0;
    let bN = 0;
    let abN = 0;
    let aTags = new Set([...a.a.tags, ...(a.b ? a.b.tags : [])]);
    let bTags = new Set([...b.a.tags, ...(b.b ? b.b.tags : [])]);
    for (const tag of aTags) {
        if (bTags.has(tag))
            abN++;
        else
            aN++;
    }
    for (const tag of bTags) {
        if (!aTags.has(tag))
            bN++;
    }
    return Math.min(aN, bN, abN);
}
function writeFile(slides, name) {
    let output = slides.length + '\n';
    output += slides.map(s => '' + s.a.id + (s.b ? ' ' + s.b.id : '')).join('\n');
    fs_1.default.writeFileSync(name, output);
}
function go(file) {
    const photos = parseFile(file);
    let slides = createSlideshow(photos);
    console.time('sorting');
    for (let i = 0; i < slides.length - 1; ++i) {
        const timeName = `sorting ${i + 1}/${slides.length}`;
        console.time(timeName);
        let bestIndex = i + 1;
        let bestDiff = 0;
        for (let i2 = i + 1; i2 < slides.length; ++i2) {
            let diff = compare(slides[i], slides[i2]);
            if (diff > bestDiff) {
                bestDiff = diff;
                bestIndex = i2;
                if (bestDiff > 2)
                    break;
            }
        }
        let t = slides[i + 1];
        slides[i + 1] = slides[bestIndex];
        slides[bestIndex] = t;
        console.timeEnd(timeName);
    }
    console.timeEnd('sorting');
    console.log(`score: ${score(slides)}`);
    writeFile(slides, `${file}.out`);
}
go(process.argv[2]);
//# sourceMappingURL=main.js.map