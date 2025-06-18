import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";
// import userRoutes from "./routes/user.route.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
 

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3001",
    // origin: true, // or use a regex if needed
    credentials: true,
  })
  );
  
  app.use("/api/auth", authRoutes);
  app.use("/api/messages", messageRoutes);
  // app.use("/api/users", userRoutes);
  // app.use("/api/users", userRoute); 

  if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, '0.0.0.0', () => {

  console.log("server is running on PORT:" + PORT);
  connectDB();
});
