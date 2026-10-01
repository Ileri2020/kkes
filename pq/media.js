const fs = require("node:fs");
const path = require("node:path");

const { VISUAL_CUE, OUTPUT_FILE, SUBJECT_JSON_DIR } = require("./config");

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

async function uploadVisualPages(parser, questions, file) {
  const cloudinary = getCloudinary();
  const visualPages = [...new Set(questions.filter((question) => question._needsImage).map((question) => question._sourcePage))];
  if (!visualPages.length) return;
  if (!cloudinary) {
    console.warn(`   ⚠️ ${visualPages.length} page(s) contain figure/diagram cues; Cloudinary is not configured, so image uploads are skipped.`);
    return;
  }

  for (let start = 0; start < visualPages.length; start += 3) {
    const pageBatch = visualPages.slice(start, start + 3);
    const screenshots = [];
    for (const pageNumber of pageBatch) {
      try {
        const result = await parser.getScreenshot({ partial: [pageNumber], desiredWidth: 1400, imageBuffer: true, imageDataUrl: false });
        const image = result.pages[0];
        if (image?.data?.length) screenshots.push({ pageNumber, data: image.data });
      } catch (error) {
        console.warn(`   ⚠️ Could not render figure page ${pageNumber}: ${error.message}`);
      }
    }
    await Promise.all(screenshots.map(async ({ pageNumber, data }) => {
      const pageQuestions = questions.filter((question) => question._sourcePage === pageNumber && question._needsImage);
      try {
        const dataUri = `data:image/png;base64,${Buffer.from(data).toString("base64")}`;
        const uploaded = await cloudinary.uploader.upload(dataUri, {
          folder: `kith-kin/past-questions/${path.parse(file).name}`,
          public_id: `page-${String(pageNumber).padStart(4, "0")}`,
          overwrite: true,
          resource_type: "image",
        });
        for (const question of pageQuestions) question.image = uploaded.secure_url;
        console.log(`   ☁️ Uploaded figure page ${pageNumber}: ${uploaded.secure_url}`);
      } catch (error) {
        console.warn(`   ⚠️ Could not upload figure page ${pageNumber}: ${error.message}`);
      }
    }));
    console.log(`   Image progress: ${Math.min(start + pageBatch.length, visualPages.length)}/${visualPages.length} figure pages processed`);
  }
}

function deduplicateQuestions(questions) {
  const seen = new Map();
  for (const question of questions) {
    const key = [question.type, question.subject, question.year, question.questionNumber, question.question.toLowerCase().replace(/\W/g, "")].join("|");
    const existing = seen.get(key);
    if (!existing || (!existing.image && question.image)) seen.set(key, question);
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
  uploadVisualPages,
  deduplicateQuestions,
  writeJsonAtomically,
  writeSubjectJsonFiles,
};
