import fs from 'fs'

interface Photo {
  id: number
  isV: boolean
  tags: string[]
}

interface Slide {
  a: Photo
  b?: Photo
}

function parseFile(file: string) {
  let photos = fs.readFileSync(file, 'utf-8').split('\n')
  let numPhotos = parseInt(photos.shift() || '0')
  if (photos.length > numPhotos) photos.pop()
  return photos.map((str, i) => {
    let d = str.split(' ')
    const isV = d.shift() === 'V'
    d.shift()
    const tags = d
    return { id: i, isV, tags } as Photo
  })
}

function createPhotoLists(photos: Photo[]) {
  let hList: Photo[] = []
  let vList: Photo[] = []

  for (const photo of photos) {
    if (photo.isV) vList.push(photo)
    else hList.push(photo)
  }

  return [hList, vList]
}

function createHSlides(hList: Photo[]) {
  let hSlides: Slide[] = []
  hList.forEach(function(photo, i, a) {
    hSlides.push({ a: photo })
  })
  return hSlides
}

function createVSlides(vList: Photo[]) {
  let vSlides: Slide[] = []
  for (let i = 0; i < vList.length; i += 2) {
    vSlides.push({ a: vList[i], b: vList[i + 1] })
  }
  return vSlides
}

function createSlideshow(photos: Photo[]) {
  const [hList, vList] = createPhotoLists(photos)
  return createVSlides(vList).concat(createHSlides(hList))
}

function score(slides: Slide[]) {
  let total = 0
  for (let i = 0; i < slides.length - 1; i++) {
    total += compare(slides[i], slides[i + 1])
  }
  return total
}

function compare(a: Slide, b: Slide) {
  let aN = 0
  let bN = 0
  let abN = 0

  let aTags = new Set([...a.a.tags, ...(a.b ? a.b.tags : [])])
  let bTags = new Set([...b.a.tags, ...(b.b ? b.b.tags : [])])

  for (const tag of aTags) {
    if (bTags.has(tag)) abN++
    else aN++
  }

  for (const tag of bTags) {
    if (!aTags.has(tag)) bN++
  }

  return Math.min(aN, bN, abN)
}

function writeFile(slides: Slide[], name: string) {
  let output = slides.length + '\n'
  output += slides.map(s => '' + s.a.id + (s.b ? ' ' + s.b.id : '')).join('\n')
  fs.writeFileSync(name, output)
}

function go(file: string) {
  const photos = parseFile(file)

  let slides = createSlideshow(photos)
  console.time('sorting')

  for (let i = 0; i < slides.length - 1; ++i) {
    const timeName = `sorting ${i + 1}/${slides.length}`
    console.time(timeName)

    let bestIndex = i + 1
    let bestDiff = 0

    for (let i2 = i + 1; i2 < slides.length; ++i2) {
      let diff = compare(slides[i], slides[i2])

      if (diff > bestDiff) {
        bestDiff = diff
        bestIndex = i2
        if (bestDiff > 2) break
      }
    }

    let t = slides[i + 1]
    slides[i + 1] = slides[bestIndex]
    slides[bestIndex] = t

    console.timeEnd(timeName)
  }

  console.timeEnd('sorting')

  console.log(`score: ${score(slides)}`)

  writeFile(slides, `${file}.out`)
}

go(process.argv[2])
