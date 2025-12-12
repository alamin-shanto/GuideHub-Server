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
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("tiny"));

// simple root endpoint for quick checks
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "GuideHub API",
    docs: "/api",
    note: "API is up — visit /health or /api/guides/top",
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

// error handler (should be last)
app.use(errorHandler);

export default app;
