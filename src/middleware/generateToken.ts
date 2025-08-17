import jwt from "jsonwebtoken";

const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY as string;
const generateToken = (userId: string): string => {
  if (!JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET not defined");
  }

  return jwt.sign(
    { id: userId },                        // payload (object / string)
    JWT_SECRET_KEY,                        // secret (must NOT be null)
    { expiresIn: "1d" }                    // options (expiresIn allowed here)
  );
};

export default generateToken;