import { Router } from "express";
import { getUser, updateProfile } from "../controllers/users.controller";
import { protect } from "../middleware/auth";

const router = Router();

router.get("/:id", getUser);
router.put("/me", protect, updateProfile);

export default router;
