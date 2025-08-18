import express, { Application } from "express";
const app:Application = express();
const port: number = Number(process.env.PORT) || 5000;
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

// Middleware
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));

// Routes
import userRoute from "./src/users/user.route";
app.use("/api/auth", userRoute);


//  database connection
async function bootstrap() {
  try {
    const dbUrl = process.env.DB_URL;
    if (!dbUrl) {
      console.error("❌ No MongoDB URL found in environment variables.");
      process.exit(1);
    }

    await mongoose.connect(dbUrl);
    console.log("✅ MongoDB Connected!");

    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Failed!", error);
  }
}

// Default route
app.get("/", (req, res) => {
  res.send("Authentication Server is running!");
});

bootstrap();