import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import User from "../models/user.model.js";
import UserInfo from "../models/user.info.model.js";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";
import AccessToken from "../models/token.model.js";
import refreshToken from "../models/refresh.token.model.js";
import { minioClient } from "../minio/index.js";
import Role from "../models/role.model.js";

// Full User Profile Creation
export const createUser = asyncHandler(async (req, res) => {
  try {
    const { username, password, fullName, roleId } = req.body;
    const branchId = req.body.branchId || null;
    const userInfoData = req.body.userInfo || null;
    const allowCustomRoles = req.query.allowRoles === "true";

    const userExists = await User.findOne({ username });
    if (userExists) {
      return successResponse(res, 400, "User already exists", []);
    }

    if (userInfoData == null) {
      return successResponse(res, 400, "User info is required", []);
    }

    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      maritalStatus,
      occupation,
    } = userInfoData;

    const address = userInfoData.address || "";
    const phoneNumber = userInfoData.phoneNumber || "";
    const email = userInfoData.email || "";
    const identifications = userInfoData.identifications || [];

    // Create UserInfo document
    const userInfo = await UserInfo.create({
      firstName,
      lastName,
      gender,
      dateOfBirth,
      maritalStatus,
      occupation,
      address,
      phoneNumber,
      email,
      identifications,
    });

    const userInfoId = userInfo._id;

    let finalRoles = [];
    if (allowCustomRoles && Array.isArray(roleId) && roleId.length > 0) {
      const invalidRole = roleId.find(
        (role) => !mongoose.Types.ObjectId.isValid(role)
      );
      if (invalidRole) {
        return errorResponse(res, 400, "Invalid role id supplied", []);
      }
      finalRoles = roleId.map((role) => new mongoose.Types.ObjectId(role));
    } else {
      const defaultRole = await Role.findOne({ name: { $regex: /^user$/i } });
      if (!defaultRole) {
        return errorResponse(
          res,
          500,
          "Default user role not configured",
          []
        );
      }
      finalRoles = [defaultRole._id];
    }

    // Create User document with reference to UserInfo
    const user = await User.create({
      username,
      password,
      fullName,
      roleId: finalRoles,
      branchId,
      userInfoId,
    });

    // Generate access token and refresh token for new user
    const createAccessToken = generateAccessToken(user._id);
    const createRefreshToken = generateRefreshToken(user._id);

    // Save refresh token in database
    await refreshToken.create({ userId: user._id, token: createRefreshToken });
    // Save access token in database
    await AccessToken.create({ userId: user._id, token: createAccessToken });

    // 4️⃣ Populate UserInfo before sending response
    const userObj = await User.findById(user._id)
      .populate("userInfoId")
      .populate("roleId")
      // .populate("branchId")
      .lean();

    delete userObj.__v;
    delete userObj.password;
    if (userObj.userInfoId) {
      delete userObj.userInfoId.__v;
    }

    const userData = {
      user: userObj,
      token: createAccessToken,
    };

    return successResponse(res, 201, "User created successfully", userData);
  } catch (error) {
    errorResponse(
      res,
      500,
      "Failed to create user and user info",
      error.message
    );
  }
});

export const getUsers = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || process.env.DEFAULT_PAGE_SIZE;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const {
      populate,
      search,
      gender,
      maritalStatus,
      cardType,
      cardCode,
      idSearch,
      startDate,
      endDate,
      branchId,
      select,
      sort,
    } = req.query;

    // Build filter
    const filter = { deleted: false };
    if (branchId) filter.branchId = new mongoose.Types.ObjectId(branchId);
    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    // Sorting only user schema fields
    const sortOptions = { createdAt: -1 };
    if (sort) {
      sortOptions = {};
      const sortParams = sort.split(",");
      sortParams.forEach((param) => {
        const [field, direction] = param.split(":").map((p) => p.trim());
        if (field) {
          sortOptions[field] = direction === "asc" ? 1 : -1;
        }
      });
    }

    // Search in basic fields
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ Identification filtering
    if (cardType) filter["identifications.cardType"] = cardType;
    if (cardCode) filter["identifications.cardCode"] = cardCode;
    // ✅ Search inside identifications
    if (idSearch) {
      filter.$or = [
        ...(filter.$or || []),
        { "identifications.cardType": { $regex: idSearch, $options: "i" } },
        { "identifications.cardCode": { $regex: idSearch, $options: "i" } },
      ];
    }

    // Gender filter
    if (gender) filter.gender = gender;
    // Marital status filter
    if (maritalStatus) filter.maritalStatus = maritalStatus;

    // Main Query (User)
    let query = User.find(branchId ? { branchId: branchId } : {})
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .setOptions({ strictPopulate: false });

    // Dynamic Select
    if (select) query = query.select(select.split(",").join(" "));

    // ✅ Populate from User schema
    if (populate) {
      const fields = populate.split(",").map((f) => f.trim());
      fields.forEach((field) => {
        // Special case: userInfoId needs filtering by gender, etc.
        if (field === "userInfoId") {
          query = query.populate({
            path: "userInfoId",
            match: filter, // apply filters
          });
        } else {
          query = query.populate(field); // normal populate
        }
      });
    } else {
      query = query.populate("roleId branchId userInfoId");
    }

    const users = await query.lean({ virtuals: true });
    const filteredUsers = users.filter((u) =>
      !u.userInfoId || !filter ? true : u.userInfoId !== null
    );

    const total = await User.countDocuments(
      branchId ? { branchId: mongoose.Types.ObjectId(branchId) } : {}
    );

    const userData = {
      total,
      page,
      pageSize: filteredUsers.length,
      users: total > 0 ? filteredUsers : [],
    };

    return successResponse(res, 200, "data get successfully", userData);
  } catch (error) {
    return errorResponse(res, 500, "Failed to get user info", error.message);
  }
});

export const getUserInfoById = asyncHandler(async (req, res) => {
  try {
    const { userInfoId } = req.params;

    if (!userInfoId && !mongoose.Types.ObjectId.isValid(userInfoId)) {
      return successResponse(res, 400, "Invalid user info ID", []);
    }
    const userInfo = await UserInfo.findById(userInfoId).lean();
    if (!userInfo) {
      return successResponse(
        res,
        404,
        `UserInfo not found with id: ${userInfoId}`,
        []
      );
    }

    delete userInfo.password;
    delete userInfo.__v;
    delete userInfo.deleted;

    let result = { userInfoId: userInfo };
    const user = await User.findOne({ userInfoId })
      .populate([{ path: "branchId" }, { path: "roleId" }])
      .lean();
    if (user) {
      result.branchId = user.branchId;
      result.roleId = user.roleId;
      result.username = user.username;
      result.fullName = user.fullName;
    }

    return successResponse(res, 200, "User profile get successfully.", result);
  } catch (error) {
    return errorResponse(res, 500, "Internal server error", error.message);
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const {
      username,
      password,
      fullName,
      roleId,
      branchId,
      isActive,
      userInfo,
    } = req.body;

    const user = await User.findById(id);

    if (!user) {
      return errorResponse(res, 404, "User not found", []);
    }

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return errorResponse(res, 400, "Username already exists", []);
      }
      user.username = username;
    }

    if (fullName) {
      user.fullName = fullName;
    }

    if (Array.isArray(roleId) && roleId.length > 0) {
      const invalidRole = roleId.find(
        (role) => !mongoose.Types.ObjectId.isValid(role)
      );
      if (invalidRole) {
        return errorResponse(res, 400, "Invalid role id supplied", []);
      }
      user.roleId = roleId.map((role) => new mongoose.Types.ObjectId(role));
    }

    if (typeof isActive === "boolean") {
      user.isActive = isActive;
    }

    if (branchId !== undefined) {
      if (branchId && !mongoose.Types.ObjectId.isValid(branchId)) {
        return errorResponse(res, 400, "Invalid branch id supplied", []);
      }
      user.branchId = branchId ? new mongoose.Types.ObjectId(branchId) : null;
    }

    if (password && password.trim()) {
      user.password = password;
    }

    if (userInfo && typeof userInfo === "object") {
      const infoUpdates = {};
      const allowedFields = [
        "firstName",
        "lastName",
        "gender",
        "dateOfBirth",
        "maritalStatus",
        "occupation",
        "address",
        "phoneNumber",
        "email",
        "identifications",
      ];

      allowedFields.forEach((field) => {
        if (userInfo[field] !== undefined) {
          infoUpdates[field] = userInfo[field];
        }
      });

      if (Object.keys(infoUpdates).length > 0) {
        const existingUserInfo = user.userInfoId
          ? await UserInfo.findById(user.userInfoId)
          : null;

        if (existingUserInfo) {
          Object.assign(existingUserInfo, infoUpdates);
          await existingUserInfo.save();
        } else {
          const newUserInfo = await UserInfo.create(infoUpdates);
          user.userInfoId = newUserInfo._id;
        }
      }
    }

    await user.save();

    const updatedUser = await User.findById(id)
      .populate("roleId")
      .populate("branchId")
      .populate("userInfoId")
      .lean();

    if (updatedUser) {
      delete updatedUser.password;
    }

    return successResponse(res, 200, "User updated successfully", updatedUser);
  } catch (error) {
    console.error("Update user error:", error);
    return errorResponse(
      res,
      500,
      "Failed to update user profile",
      error.message
    );
  }
});

export const deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
});

export const createUserProfile = asyncHandler(async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      gender,
      dateOfBirth,
      maritalStatus,
      occupation,
    } = req.body;

    const address = req.body.address || "";
    const phoneNumber = req.body.phoneNumber || "";
    const email = req.body.email || "";
    const identifications = req.body.identifications || [];

    // Create UserInfo document
    const userInfo = await UserInfo.create({
      firstName,
      lastName,
      gender,
      dateOfBirth,
      maritalStatus,
      occupation,
      address,
      phoneNumber,
      email,
      identifications,
    });

    delete userInfo.__v;

    return successResponse(
      res,
      201,
      "User profile created successfully",
      userInfo
    );
  } catch (error) {
    errorResponse(res, 500, "Failed to create user info", error.message);
  }
});

export const getUserInfo = asyncHandler(async (req, res) => {
  try {
    const { select, sort } = req.query;

    const limit = parseInt(req.query.limit) || process.env.DEFAULT_PAGE_SIZE;
    const page = parseInt(req.query.page) || 1;

    let selectFields = "-__v"; // Always exclude __v
    if (select) {
      // Example: ?select=name,description
      const fields = select.split(",").join(" ");
      selectFields = `${fields} -__v`;
    }

    // ✅ Pagination options
    const options = {
      page,
      limit,
      select: selectFields,
      sort: sort || "-createdAt",
      lean: true,
    };

    const userInfos = await UserInfo.paginate({}, options);

    return successResponse(res, 200, "data get successfully", userInfos);
  } catch (error) {
    return errorResponse(res, 500, "Failed to get roles info", error.message);
  }
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const updates = req.body;
    const { id } = req.params;

    console.log("Update Data:", updates);

    // ✅ Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 400, "Invalid ID format", []);
    }

    const updateUserProfile = await UserInfo.findByIdAndUpdate(id, updates, {
      new: true, // return the updated document
      runValidators: true, // ensure validation rules are applied
    });

    // 1️⃣ Check if ID exists
    if (!updateUserProfile) {
      return errorResponse(res, 404, "User profile not found", []);
    }

    // 2️⃣ Check if data actually changed
    // (Compare with req.body or handle versioning)
    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 400, "No fields to update", []);
    }

    return successResponse(
      res,
      200,
      "data update successfully",
      updateUserProfile
    );
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to update user profile by Id",
      error.message
    );
  }
});

export const updateSelfProfile = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, userInfo } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 404, "User not found", []);
    }

    if (fullName) {
      user.fullName = fullName;
    }

    let updatedUserInfo;
    if (userInfo && user.userInfoId) {
      updatedUserInfo = await UserInfo.findById(user.userInfoId);
      if (!updatedUserInfo) {
        return errorResponse(res, 404, "User profile not found", []);
      }
      Object.assign(updatedUserInfo, userInfo);
      await updatedUserInfo.save();
    }

    await user.save();

    const refreshedUser = await User.findById(userId)
      .populate(["roleId", "branchId", "userInfoId"])
      .lean({ virtuals: true });

    if (refreshedUser) {
      delete refreshedUser.password;
      delete refreshedUser.__v;
      if (refreshedUser.userInfoId) {
        delete refreshedUser.userInfoId.__v;
      }
    }

    return successResponse(res, 200, "Profile updated successfully", refreshedUser);
  } catch (error) {
    return errorResponse(res, 500, "Failed to update profile", error.message);
  }
});

export const updateSelfPhoto = asyncHandler(async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return errorResponse(res, 400, "Photo file is required");
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.userInfoId) {
      return errorResponse(res, 404, "User profile not found");
    }

    const userInfo = await UserInfo.findById(user.userInfoId);
    if (!userInfo) {
      return errorResponse(res, 404, "User info not found");
    }

    const existing = userInfo.profilePhoto;
    if (existing?.bucket && existing?.filename) {
      try {
        await minioClient.removeObject(existing.bucket, existing.filename);
      } catch (removalErr) {
        console.warn("Failed to remove previous profile photo", removalErr);
      }
    }

    userInfo.profilePhoto = {
      bucket: file.bucket,
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
    };
    await userInfo.save();

    return successResponse(res, 200, "Profile photo updated", {
      photoUrl: "/api/user/me/profile/photo",
    });
  } catch (error) {
    return errorResponse(res, 500, "Failed to update profile photo", error.message);
  }
});

export const getSelfPhoto = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("userInfoId");
    const photo = user?.userInfoId?.profilePhoto;
    if (!photo || !photo.bucket || !photo.filename) {
      return errorResponse(res, 404, "Profile photo not found");
    }

    const stream = await minioClient.getObject(photo.bucket, photo.filename);
    res.setHeader("Content-Type", photo.mimetype || "image/jpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=\"${photo.originalname || photo.filename}\"`
    );
    return stream.pipe(res);
  } catch (error) {
    return errorResponse(res, 500, "Failed to load profile photo", error.message);
  }
});
