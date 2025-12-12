import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";

import authRoutes from "./routes/auth.routes";
import usersRoutes from "./routes/users.routes";
import listingsRoutes from "./routes/listings.routes";
import bookingsRoutes from "./routes/bookings.routes";
import paymentsRoutes from "./routes/payments.routes";
import errorHandler from "./middleware/errorHandler";

const app = express();

app.use(helmet());

// 🔥 Secure CORS setup
const WHITELIST = [
  "http://localhost:3000",
  "https://guide-hub-client.vercel.app",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (WHITELIST.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("tiny"));

// root for quick check
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "GuideHub API",
    note: "API running",
  });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/payments", paymentsRoutes);

// health
app.get("/health", (_req, res) => res.json({ ok: true }));

// error handler
app.use(errorHandler);

export default app;
