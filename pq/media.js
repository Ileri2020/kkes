const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const { OUTPUT_FILE, SUBJECT_JSON_DIR, QUESTION_IMAGE_DIR } = require("./config");

function getCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return null;
  const cloudinary = require("cloudinary").v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  return cloudinary;
}

function normalizeQuestionImage(image) {
  if (typeof image === "string") return { localUrl: null, cloudinaryUrl: image || null };
  return {
    localUrl: image?.localUrl || null,
    cloudinaryUrl: image?.cloudinaryUrl || null,
  };
}

function safePathSegment(value) {
  return String(value || "unknown").toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function questionImageFilename(question) {
  const year = Number.isInteger(question.year) ? question.year : "unknown";
  const number = Number.isInteger(question.questionNumber) ? question.questionNumber : "unknown";
  return `${year}_${number}.png`;
}

function findQuestionStarts(textContent, viewport) {
  const positionedItems = textContent.items
    .filter((item) => typeof item.str === "string" && item.str.trim() && Array.isArray(item.transform))
    .map((item) => {
      const point = viewport.convertToViewportPoint(item.transform[4], item.transform[5]);
      const fontHeight = Math.hypot(item.transform[2], item.transform[3]) || item.height || 10;
      return {
        text: item.str.trim(),
        top: Math.max(0, point[1] - fontHeight),
        bottom: point[1],
        baseline: point[1],
        x: point[0],
      };
    })
    .sort((left, right) => left.baseline - right.baseline || left.x - right.x);

  const rows = [];
  for (const item of positionedItems) {
    let row = rows.at(-1);
    if (!row || Math.abs(row.baseline - item.baseline) > 2.5) {
      row = { text: "", top: item.top, bottom: item.bottom, baseline: item.baseline, x: item.x };
      rows.push(row);
    }
    row.text = `${row.text} ${item.text}`.trim();
    row.top = Math.min(row.top, item.top);
    row.bottom = Math.max(row.bottom, item.bottom);
  }

  return rows.flatMap((row) => {
    const match = row.text.match(/^(?:question\s*)?((?:\d\s*){1,3})(?:[.):]+|\s+(?=[A-Za-z]))/i);
    if (!match) return [];
    const questionNumber = Number(match[1].replace(/\s+/g, ""));
    if (questionNumber < 1 || questionNumber > 150) return [];
    return [{ questionNumber, top: row.top, bottom: row.bottom, x: row.x }];
  });
}

function buildQuestionCropRegions(pageWidth, pageHeight, questionStarts, questions, padding = 6) {
  const sortedByX = questionStarts.map((start, index) => ({ ...start, _cropIndex: index }))
    .sort((left, right) => left.x - right.x);
  const columns = [];
  for (const start of sortedByX) {
    let column = columns.at(-1);
    if (!column || start.x - column.lastX > pageWidth * 0.2) {
      column = { starts: [], minX: start.x, maxX: start.x, lastX: start.x };
      columns.push(column);
    }
    column.starts.push(start);
    column.maxX = start.x;
    column.lastX = start.x;
  }
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    const leftBoundary = index === 0
      ? 0
      : (columns[index - 1].maxX + column.minX) / 2;
    const rightBoundary = index === columns.length - 1
      ? pageWidth
      : (column.maxX + columns[index + 1].minX) / 2;
    column.left = Math.max(0, Math.floor(leftBoundary + (index ? padding : 0)));
    column.width = Math.max(1, Math.ceil(rightBoundary - (index < columns.length - 1 ? padding : 0)) - column.left);
    column.starts.sort((left, right) => left.top - right.top);
  }

  const assignedIndexes = new Set();
  return questions.flatMap((question) => {
    let startIndex = -1;
    let selectedColumn;
    for (const column of columns) {
      startIndex = column.starts.findIndex((start, index) => !assignedIndexes.has(start._cropIndex)
        && start.questionNumber === question.questionNumber);
      if (startIndex >= 0) {
        selectedColumn = column;
        break;
      }
    }
    if (!selectedColumn || startIndex < 0) return [];
    const start = selectedColumn.starts[startIndex];
    assignedIndexes.add(start._cropIndex);
    const next = selectedColumn.starts.slice(startIndex + 1).find((candidate) => candidate.top > start.top);
    const top = Math.max(0, Math.floor(start.top - padding));
    const questionEnd = Math.min(next?.top ?? pageHeight, start.top + pageHeight * 0.7);
    const bottom = Math.min(pageHeight, Math.ceil(questionEnd - padding));
    if (bottom <= top) return [];
    return [{ question, left: selectedColumn.left, width: selectedColumn.width, top, height: bottom - top }];
  });
}

function findPdfImageRegions(operatorList, pdfjs, viewport) {
  let transform = [1, 0, 0, 1, 0, 0];
  const transformStack = [];
  const regions = [];
  const imageOps = new Set([
    pdfjs.OPS.paintImageXObject,
    pdfjs.OPS.paintInlineImageXObject,
    pdfjs.OPS.paintImageMaskXObject,
    pdfjs.OPS.paintImageMaskXObjectGroup,
    pdfjs.OPS.paintJpegXObject,
  ].filter(Number.isInteger));

  for (let index = 0; index < operatorList.fnArray.length; index += 1) {
    const operation = operatorList.fnArray[index];
    const args = operatorList.argsArray[index] || [];
    if (operation === pdfjs.OPS.save) {
      transformStack.push([...transform]);
    } else if (operation === pdfjs.OPS.restore) {
      transform = transformStack.pop() || [1, 0, 0, 1, 0, 0];
    } else if (operation === pdfjs.OPS.transform) {
      transform = pdfjs.Util.transform(transform, args);
    } else if (imageOps.has(operation)) {
      const [a, b, c, d, e, f] = transform;
      const corners = [
        [e, f],
        [a + e, b + f],
        [c + e, d + f],
        [a + c + e, b + d + f],
      ].map(([x, y]) => viewport.convertToViewportPoint(x, y));
      const left = Math.min(...corners.map(([x]) => x));
      const right = Math.max(...corners.map(([x]) => x));
      const top = Math.min(...corners.map(([, y]) => y));
      const bottom = Math.max(...corners.map(([, y]) => y));
      if (right > left && bottom > top) {
        regions.push({
          name: args[0] ?? `inline-${index}`,
          left,
          top,
          width: right - left,
          height: bottom - top,
          areaRatio: ((right - left) * (bottom - top)) / (viewport.width * viewport.height),
        });
      }
    }
  }
  return regions;
}

function matchQuestionImages(questionRegions, imageRegions, questions, maxAreaRatio = 0.6) {
  return questions.flatMap((question, index) => {
    const questionRegion = questionRegions[index];
    if (!questionRegion) return [];
    const matchingImages = imageRegions
      .filter((image) => image.areaRatio <= maxAreaRatio
        && image.left < questionRegion.left + questionRegion.width
        && image.left + image.width > questionRegion.left
        && image.top < questionRegion.top + questionRegion.height
        && image.top + image.height > questionRegion.top)
      .sort((left, right) => right.width * right.height - left.width * left.height);
    if (!matchingImages.length) return [];
    const left = Math.min(...matchingImages.map((image) => image.left));
    const top = Math.min(...matchingImages.map((image) => image.top));
    const right = Math.max(...matchingImages.map((image) => image.left + image.width));
    const bottom = Math.max(...matchingImages.map((image) => image.top + image.height));
    return [{ question, left, top, width: right - left, height: bottom - top, sourceImages: matchingImages.map(({ name }) => name) }];
  });
}

async function generateQuestionImages(parser, questions, file, options = {}) {
  const imageQuestions = questions.filter((question) => question._needsImage && Number.isInteger(question._sourcePage));
  const visualPages = [...new Set(imageQuestions.map((question) => question._sourcePage))];
  if (!visualPages.length) return { generated: 0, uploaded: 0 };

  const cloudinary = options.uploadImages ? getCloudinary() : null;
  if (options.uploadImages && !cloudinary) {
    console.warn("   ⚠️ Cloudinary upload requested, but credentials are missing; local images will still be generated.");
  }
  const sourceSlug = safePathSegment(path.parse(file).name);
  const imageDirectory = options.imageDirectory || QUESTION_IMAGE_DIR;
  const sourceImageDirectory = path.join(imageDirectory, sourceSlug);
  const routePrefix = options.routePrefix || "/api/pq/images";
  let generated = 0;
  let uploadedCount = 0;
  let pdfDocument = options.pdfDocument;

  if (!pdfDocument) {
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(fs.readFileSync(options.pdfPath || path.join(__dirname, "jamb", file))),
        isEvalSupported: false,
        useSystemFonts: true,
        verbosity: 0,
      });
      pdfDocument = await loadingTask.promise;
    } catch (error) {
      console.warn(`   ⚠️ Could not read PDF layout for question-specific image crops: ${error.message}`);
      return { generated, uploaded: uploadedCount };
    }
  }

  fs.mkdirSync(sourceImageDirectory, { recursive: true });
  try {
    for (let start = 0; start < visualPages.length; start += 3) {
      const pageBatch = visualPages.slice(start, start + 3);
      for (const pageNumber of pageBatch) {
        const pageQuestions = imageQuestions.filter((question) => question._sourcePage === pageNumber);
        let cropRegions;
        let screenshotData;
        try {
          const pdfPage = await pdfDocument.getPage(pageNumber);
          const viewport = pdfPage.getViewport({ scale: 1, rotation: pdfPage.rotate });
          const questionStarts = findQuestionStarts(await pdfPage.getTextContent(), viewport);
          const questionRegions = buildQuestionCropRegions(viewport.width, viewport.height, questionStarts, pageQuestions);
          const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
          const imageRegions = findPdfImageRegions(await pdfPage.getOperatorList(), pdfjs, viewport);
          cropRegions = matchQuestionImages(questionRegions, imageRegions, pageQuestions);
          if (!cropRegions.length) {
            console.warn(`   ⚠️ No embedded image object matched the flagged question(s) on page ${pageNumber}; skipped screenshot fallback.`);
            continue;
          }

          const rendered = await parser.getScreenshot({ partial: [pageNumber], desiredWidth: 1400, imageBuffer: true, imageDataUrl: false });
          screenshotData = rendered.pages[0]?.data;
          if (!screenshotData?.length) throw new Error("PDF page screenshot was empty");
          const metadata = await sharp(Buffer.from(screenshotData)).metadata();
          const scaleY = metadata.height / viewport.height;
          for (const { question, left, width, top, height, sourceImages } of cropRegions) {
            const filename = questionImageFilename(question);
            const imagePath = path.join(sourceImageDirectory, filename);
            const image = normalizeQuestionImage(question.image);
            let croppedData;
            try {
              croppedData = await sharp(Buffer.from(screenshotData))
                .extract({
                  left: Math.max(0, Math.floor(left * metadata.width / viewport.width)),
                  top: Math.max(0, Math.floor(top * scaleY)),
                  width: Math.max(1, Math.min(metadata.width - Math.floor(left * metadata.width / viewport.width), Math.ceil(width * metadata.width / viewport.width))),
                  height: Math.max(1, Math.min(metadata.height - Math.floor(top * scaleY), Math.ceil(height * scaleY))),
                })
                .png()
                .toBuffer();
              fs.writeFileSync(imagePath, croppedData);
              image.localUrl = `${routePrefix}/${sourceSlug}/${filename}`;
              generated += 1;
            } catch (error) {
              console.warn(`   ⚠️ Could not crop/save ${question.year ?? "unknown"}#${question.questionNumber}: ${error.message}`);
              continue;
            }

            if (cloudinary) {
              try {
                const uploaded = await cloudinary.uploader.upload(`data:image/png;base64,${croppedData.toString("base64")}`, {
                  folder: `kith-kin/past-questions/${sourceSlug}`,
                  public_id: path.parse(filename).name,
                  overwrite: true,
                  resource_type: "image",
                });
                image.cloudinaryUrl = uploaded.secure_url;
                uploadedCount += 1;
              } catch (error) {
                console.warn(`   ⚠️ Could not upload cropped image for ${question.year ?? "unknown"}#${question.questionNumber}: ${error.message}`);
              }
            }
            question.image = image;
            console.log(`      Extracted PDF image asset(s) ${sourceImages.join(", ")} for ${question.year ?? "unknown"}#${question.questionNumber}`);
          }
          console.log(`   🖼️ Extracted embedded image regions on PDF page ${pageNumber}: ${cropRegions.length} question(s)`);
        } catch (error) {
          console.warn(`   ⚠️ Could not crop question image regions from page ${pageNumber}: ${error.message}`);
        }
      }
      console.log(`   Image progress: ${Math.min(start + pageBatch.length, visualPages.length)}/${visualPages.length} figure pages processed`);
    }
  } finally {
    if (!options.pdfDocument) await pdfDocument.destroy().catch(() => {});
  }
  return { generated, uploaded: uploadedCount };
}

function deduplicateQuestions(questions) {
  const seen = new Map();
  for (const question of questions) {
    const key = [question.type, question.subject, question.year, question.questionNumber, question.question.toLowerCase().replace(/\W/g, "")].join("|");
    const existing = seen.get(key);
    const existingImage = normalizeQuestionImage(existing?.image);
    const questionImage = normalizeQuestionImage(question.image);
    if (!existing || ((!existingImage.localUrl && !existingImage.cloudinaryUrl) && (questionImage.localUrl || questionImage.cloudinaryUrl))) seen.set(key, question);
  }
  return [...seen.values()];
}

function writeJsonAtomically(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporaryFile = `${file}.tmp`;
  fs.writeFileSync(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporaryFile, file);
}

function writeSubjectJsonFiles(questions, directory = SUBJECT_JSON_DIR) {
  const questionsBySubject = new Map();
  for (const question of questions) {
    const subject = String(question.subject || "General").trim() || "General";
    if (!questionsBySubject.has(subject)) questionsBySubject.set(subject, []);
    questionsBySubject.get(subject).push(question);
  }

  return [...questionsBySubject.entries()].map(([subject, subjectQuestions]) => {
    const filename = subject.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "general";
    const file = path.join(directory, `${filename}.json`);
    writeJsonAtomically(file, subjectQuestions);
    return { subject, file, count: subjectQuestions.length };
  });
}


module.exports = {
  getCloudinary,
  normalizeQuestionImage,
  questionImageFilename,
  findQuestionStarts,
  buildQuestionCropRegions,
  findPdfImageRegions,
  matchQuestionImages,
  generateQuestionImages,
  deduplicateQuestions,
  writeJsonAtomically,
  writeSubjectJsonFiles,
};
