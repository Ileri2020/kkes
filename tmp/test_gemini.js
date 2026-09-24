const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not found in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello, who are you? Answer briefly.");
    const response = await result.response;
    console.log(`Model ${modelName} works! Response: ${response.text().substring(0, 50)}...`);
    return true;
  } catch (err) {
    console.error(`Model ${modelName} failed: ${err.message}`);
    return false;
  }
}

async function run() {
  console.log("Testing gemini-1.5-flash...");
  await testModel("gemini-1.5-flash");
  
  console.log("\nTesting gemini-2.5-flash...");
  await testModel("gemini-2.5-flash");

  console.log("\nTesting gemini-2.0-flash (preview)...");
  await testModel("gemini-2.0-flash-exp");
}

run();
