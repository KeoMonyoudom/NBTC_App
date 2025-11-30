import asyncHandler from "express-async-handler";
import Branch from "../models/branch.model.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";

export const createBranch = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      address = "",
      city = "",
      phone = "",
      manager = null,
    } = req.body;
    if (!name) {
      return successResponse(res, 400, "Branch name is required", []);
    }
    const branchExists = await Branch.findOne({ name });
    if (branchExists) {
      return successResponse(res, 400, "Branch already exists", []);
    }

    const branch = await Branch.create({
      name,
      address,
      city,
      phone,
      managerId: manager,
    });

    // populate manager details if managerId is provided
    const populatedBranch = manager
      ? await branch.populate("managerId")
      : branch;

    const branchObj = populatedBranch.toObject();
    delete branchObj.__v;
    return successResponse(res, 201, "Branch created successfully", branchObj);
  } catch (error) {
    errorResponse(res, 500, "Internal server error", error.message);
  }
});

export const getBranches = asyncHandler(async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true })
      .select("-__v")
      .populate({ path: "managerId", select: "-password -__v -_id" })
      .lean();
    return successResponse(
      res,
      200,
      "Branches retrieved successfully",
      branches
    );
  } catch (error) {
    return errorResponse(res, 500, "Internal server error", error.message);
  }
});

export const getBranchById = asyncHandler(async (req, res) => {
  try {
    const branchId = req.params.id;
    const branch = await Branch.findById(branchId).select("-__v");
    if (!branch) {
      return successResponse(res, 404, "Branch not found", []);
    }
    return successResponse(res, 200, "Branch retrieved successfully", branch);
  } catch (error) {
    return errorResponse(res, 500, "Internal server error", error.message);
  }
});

export const updateBranch = asyncHandler(async (req, res) => {
  try {
    const branchId = req.params.id;
    const { name, address, city, phone, isActive } = req.body;
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return successResponse(res, 404, "Branch not found", []);
    }
    branch.name = name || branch.name;
    branch.address = address || branch.address;
    branch.city = city || branch.city;
    branch.phone = phone || branch.phone;
    if (isActive !== undefined) {
      branch.isActive = isActive;
    }
    const updatedBranch = await branch.save();
    const branchObj = updatedBranch.toObject();
    delete branchObj.__v;
    return successResponse(res, 200, "Branch updated successfully", branchObj);
  } catch (error) {
    return errorResponse(res, 500, "Internal server error", error.message);
  }
});

export const deleteBranch = asyncHandler(async (req, res) => {
  try {
    const branchId = req.params.id;
    const branch = await Branch.findById(branchId);
    if (!branch) {
      return successResponse(res, 404, "Branch not found", []);
    }
    branch.isActive = false;
    await branch.save();
    return successResponse(res, 200, "Branch deleted successfully", []);
  } catch (error) {
    return errorResponse(res, 500, "Internal server error", error.message);
  }
});
