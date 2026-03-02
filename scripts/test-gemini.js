const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Helper to parse .env format
function parseEnv(content) {
    const env = {};
    content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
                value = value.replace(/\\n/gm, '\n');
            }
            value = value.replace(/(^['"]|['"]$)/g, '').trim();
            env[key] = value;
        }
    });
    return env;
}

// Load .env logic
const envPath = path.resolve(__dirname, '../.env');
const envLocalPath = path.resolve(__dirname, '../.env.local');

let loadedEnv = {};

if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, 'utf8');
    loadedEnv = { ...loadedEnv, ...parseEnv(content) };
}

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const parsed = parseEnv(content);
    for (const k in parsed) {
        if (!loadedEnv[k]) loadedEnv[k] = parsed[k];
    }
}

// Set process.env
for (const k in loadedEnv) {
    process.env[k] = loadedEnv[k];
}

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("API Key is missing.");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Test just one common model to see the full error
    const modelName = "gemini-1.5-flash";

    console.log(`Testing ${modelName} with detailed error logging...`);

    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello.");
        const response = await result.response;
        console.log(`✅ Success!`);
    } catch (error) {
        console.log(`❌ Failed.`);
        console.log("---------------------------------------------------");
        console.log("Full Error Object:");
        console.dir(error, { depth: null });
        console.log("---------------------------------------------------");
        if (error.response) {
            console.log("Response Data:", JSON.stringify(error.response, null, 2));
        }
    }
}

listModels();
