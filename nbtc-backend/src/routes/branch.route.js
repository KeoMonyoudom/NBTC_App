import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  createBranch,
  deleteBranch,
  getBranchById,
  getBranches,
  updateBranch,
} from "../controllers/branch.controller.js";
import { objectIdValidator } from "../validators/id.validator.js";

const router = express.Router();

router
  .route("/")
  .get(authenticate, getBranches)
  .post(authenticate, authorize(["Admin"]), createBranch);

router
  .route("/:id")
  .get(authenticate, authorize(["Admin"]), objectIdValidator("param", "id"), getBranchById)
  .patch(
    authenticate,
    authorize(["Admin"]),
    objectIdValidator("param", "id"),
    updateBranch
  )
  .delete(
    authenticate,
    authorize(["Admin"]),
    objectIdValidator("param", "id"),
    deleteBranch
  );

export default router;
