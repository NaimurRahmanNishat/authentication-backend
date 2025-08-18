"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 5000;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const body_parser_1 = __importDefault(require("body-parser"));
// Middleware
app.use(express_1.default.json({ limit: "20mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "20mb" }));
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "https://authentication-frontend-gold.vercel.app"],
    credentials: true
}));
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json({ limit: "20mb" }));
app.use(body_parser_1.default.urlencoded({ extended: true, limit: "20mb" }));
// Routes
const user_route_1 = __importDefault(require("./src/users/user.route"));
app.use("/api/auth", user_route_1.default);
//  database connection
async function bootstrap() {
    try {
        const dbUrl = process.env.DB_URL;
        if (!dbUrl) {
            console.error("❌ No MongoDB URL found in environment variables.");
            process.exit(1);
        }
        await mongoose_1.default.connect(dbUrl);
        console.log("✅ MongoDB Connected!");
        app.listen(port, () => {
            console.log(`🚀 Server running on http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error("❌ MongoDB Connection Failed!", error);
    }
}
// Default route
app.get("/", (req, res) => {
    res.send("Authentication Server is running!");
});
bootstrap();
