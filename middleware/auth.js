// middleware/auth.js
import admin from "../firebaseAdmin.js"; // Importing the default export

const authenticateToken = async (req, res, next) => {
  const token =
    req.headers.authorization && req.headers.authorization.split(" ")[1];

  if (!token) return res.sendStatus(401); // Unauthorized

  try {
    const decodedToken = await admin.verifyIdToken(token);
    req.user = decodedToken; // Attach the user information to the request object
    next(); // Call the next middleware or route handler
  } catch (error) {
    return res.sendStatus(403); // Forbidden
  }
};

export default authenticateToken; // Exporting the middleware
