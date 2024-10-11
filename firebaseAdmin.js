import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";  // Needed to work with import.meta.url

// Get the correct path for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Construct the path to the service account JSON file
const serviceAccountPath = path.resolve(__dirname, "serviceaccountkey.json");

// Read and parse the JSON file for Firebase credentials
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
} catch (error) {
  console.error(`Error reading service account key from ${serviceAccountPath}:`, error);
  process.exit(1);  // Exit the process if the file cannot be read
}

// Initialize Firebase Admin app
const app = initializeApp({
  credential: cert(serviceAccount),
});

// Get the Firebase Admin authentication object
const admin = getAuth(app);

// Export the Firebase Admin auth object as the default export
export default admin;
