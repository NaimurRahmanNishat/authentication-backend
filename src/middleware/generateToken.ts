import jwt from "jsonwebtoken";

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
if (!JWT_SECRET_KEY) {
  throw new Error("JWT_SECRET_KEY is not defined in environment variables.");
}

// ✅ Generate JWT Token
const generateToken = async (userId: string) => {
  try {
    const token = jwt.sign(
      { id: userId }, // payload
      JWT_SECRET_KEY, // secret
      { expiresIn: "1h" } // expire time (1 hour)
    );
    return token;
  } catch (error) {
    console.error("❌ Token generation failed:", error);
    throw new Error("Token could not be generated");
  }
};

export default generateToken;
