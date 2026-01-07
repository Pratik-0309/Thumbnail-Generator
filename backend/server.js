import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
import connectDB from "./config/db.js";
import userRouter from './routes/userRoute.js'

const app = express();
connectDB();

app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use("/api/user",userRouter);

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.listen(process.env.PORT || 8080, (req, res) => {
  console.log("Server is running on port 8080");
});
