const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
async function run() {
  const m = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  try {
     const r = await m.generateContent("Hi");
     console.log("gemini-1.5-flash-latest works!");
  } catch(e) { console.log("gemini-1.5-flash-latest failed: " + e.message); }
}
run();
