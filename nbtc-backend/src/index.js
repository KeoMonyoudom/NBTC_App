import express from "express";
import bodyParser from "body-parser";
import router from "./routes/index.route.js";
import cors from "cors";
import helmet from "helmet"; // Security middleware
import { connectDB } from "./config/mongoose.js";
import { errorHandler, notFound } from "./middlewares/error.handler.js";
import { serveSwagger, setupSwagger } from "./config/swagger.js";

connectDB();

const app = express();
const PORT = process.env.PORT || 8081;

app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use("/api-docs", serveSwagger, setupSwagger);
app.get("/", (req, res) => {
  return res.status(200).json({ status: "Server is running" });
});
app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
