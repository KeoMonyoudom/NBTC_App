import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Role from "../models/role.model.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";

export const createRole = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    const actions = req.body.actions || [];
    const role = await Role.create({ name, description, actions });
    const roleObj = role.toObject();
    delete roleObj.__v;
    delete roleObj._id;
    return successResponse(res, 201, "Role created successfully", roleObj);
  } catch (error) {
    errorResponse(res, 500, "Internal server error", error.message);
  }
});

export const getRoles = asyncHandler(async (req, res) => {
  try {
    const { select, sort } = req.query;

    const limit = parseInt(req.query.limit) || process.env.DEFAULT_PAGE_SIZE;
    const page = parseInt(req.query.page) || 1;
    const populate = req.query.populate || "actions";

    // ✅ Handle `select` from query
    let selectFields = "-__v"; // Always exclude __v
    if (select) {
      // Example: ?select=name,description
      const fields = select.split(",").join(" ");
      selectFields = `${fields} -__v`; // user fields + always remove __v
    }

    // ✅ Handle optional populate (e.g., ?populate=actions)
    const populateOptions = populate
      ? { path: populate, select: "-__v" }
      : null;

    // ✅ Pagination options
    const options = {
      page,
      limit,
      select: selectFields,
      sort: sort || "-createdAt",
      lean: true,
      populate: populateOptions,
    };

    const roles = await Role.paginate({}, options);

    return successResponse(res, 200, "data get successfully", roles);
  } catch (error) {
    return errorResponse(res, 500, "Failed to get roles info", error.message);
  }
});

export const getRoleById = asyncHandler(async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .select("-__v -createdAt -updatedAt")
      .populate({ path: "actions", select: "-__v" });
    if (!role) {
      return errorResponse(res, 400, "Role not found", []);
    }
    return successResponse(res, 200, "data get successfully", role);
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to get role info by Id",
      error.message
    );
  }
});

export const updateRole = asyncHandler(async (req, res) => {
  try {
    const updates = req.body;
    const { id } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid ID format", []);
    }

    const updateRole = await Role.findByIdAndUpdate(id, updates, {
      new: true, // return the updated document
      runValidators: true, // ensure validation rules are applied
    });

    // 1️⃣ Check if ID exists
    if (!updateRole) {
      return errorResponse(res, 404, "Role not found", []);
    }

    // 2️⃣ Check if data actually changed
    // (Compare with req.body or handle versioning)
    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 400, "No fields to update", []);
    }

    return successResponse(res, 200, "data update successfully", updateRole);
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to update role by Id",
      error.message
    );
  }
});

export const deleteRole = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid ID format", []);
    }

    const deleteRole = await Role.findByIdAndDelete(id);

    if (!deleteRole) {
      return errorResponse(res, 404, "Role not found", []);
    }
    return successResponse(res, 200, "Role deleted successfully", deleteRole);
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to delete role by Id",
      error.message
    );
  }
});
