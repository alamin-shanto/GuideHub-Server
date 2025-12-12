import { Request, Response } from "express";
import asyncHandler from "../middleware/asyncHandler";
import CATEGORY_MAP from "../utils/categoryMap";
import GuideModel from "../models/Guide.model";

// GET /api/guides (with optional query: category, tag, q, city, limit, skip)
export const listGuides = asyncHandler(async (req: Request, res: Response) => {
  const raw = req.query as Record<string, any>;

  const category = raw.category
    ? String(raw.category).trim().toLowerCase()
    : undefined;
  const tag = raw.tag ? String(raw.tag).trim() : undefined;
  const q = raw.q ? String(raw.q).trim() : undefined;
  const city = raw.city ? String(raw.city).trim() : undefined;
  const limit = Math.min(Math.max(Number(raw.limit) || 20, 1), 100);
  const skip = Math.max(Number(raw.skip) || 0, 0);

  const filter: any = {};

  // Category -> tags mapping (OR semantics: any mapped tag matches)
  if (category) {
    const mapped = CATEGORY_MAP[category];
    if (mapped && mapped.length > 0) {
      filter.tags = { $in: mapped };
    }
  }
  if (tag) {
    if (filter.tags && filter.tags.$in) {
      // union (OR) behavior:
      filter.tags = { $in: [...new Set([...(filter.tags.$in || []), tag])] };
    } else {
      filter.tags = { $in: [tag] };
    }
  }

  if (city) filter.city = city;

  if (q) {
    // Use regex search across several text-like fields
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"); // escape user input
    filter.$or = [
      { name: { $regex: re } },
      { bio: { $regex: re } },
      { tags: { $regex: re } },
      { location: { $regex: re } },
    ];
  }

  const guides = await GuideModel.find(filter)
    .sort({ rating: -1 })
    .skip(skip)
    .limit(limit)
    .select("name location rating img city price_per_hour bio tags")
    .lean()
    .exec();

  res.json({ guides });
});
