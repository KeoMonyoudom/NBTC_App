import { Router } from "express";
import actionRoutes from "./action.route.js";
import roleRoutes from "./role.route.js";
import userRoute from "./user.route.js";
import authRoutes from "./auth.route.js";
import branchRoutes from "./branch.route.js";
import eventRoutes from "./event.route.js";
import contentRoutes from "./content.route.js";
import heroSliderRoutes from "./hero.slider.route.js";
const router = Router();

router.use("/auth", authRoutes);
router.use("/action", actionRoutes);
router.use("/role", roleRoutes);
router.use("/user", userRoute);
router.use("/branch", branchRoutes);
router.use("/event", eventRoutes);
router.use("/content", contentRoutes);
router.use("/hero-slider", heroSliderRoutes);

export default router;
