const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listAll() {
  try {
    // There isn't a direct listModels in the SDK easily available in the same way?
    // Actually there is genAI.getGenerativeModel({ model: "models" }).list() ?? No.
    // It's usually a separate fetch call or a different method.
    
    // Let's just try gemini-1.5-flash (standard) again with v1
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: 'v1' });
    const result = await model.generateContent("Hi");
    console.log("1.5-flash (v1) works!");
  } catch (err) {
    console.log("1.5-flash (v1) failed: " + err.message);
  }
}

listAll();
