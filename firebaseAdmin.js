// firebaseAdmin.js
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
// import serviceAccount from "./serviceaccountkey.json" assert { type: "json" }; // Adjust the path
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

// Use path to construct the correct path to the JSON file
const serviceAccountPath = path.join(__dirname, "serviceaccountkey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8")); // Read and parse JSON

const app = initializeApp({
  credential: cert(serviceAccount),
});

const admin = getAuth(app);

export default admin; // Default export
