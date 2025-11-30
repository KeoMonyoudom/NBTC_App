import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import { generateAccessToken, generateRefreshToken } from "../lib/jwt.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";
import AccessToken from "../models/token.model.js";
import refreshToken from "../models/refresh.token.model.js";

// Login
export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username }).populate("roleId");

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return successResponse(res, 403, "Invalid credentials", []);
      }

      // Generate access token and refresh token for new user
      const createAccessToken = generateAccessToken(user._id);
      const createRefreshToken = generateRefreshToken(user._id);

      // Save refresh token in database
      await refreshToken.create({
        userId: user._id,
        token: createRefreshToken,
      });
      // Save access token in database
      await AccessToken.create({ userId: user._id, token: createAccessToken });

      const userData = {
        user: {
          username: user.username,
          fullName: user.fullName,
          roleId: user.roleId,
        },
        token: createAccessToken,
      };

      return successResponse(res, 200, "Login successfully", userData);
    } else {
      return successResponse(res, 401, "Invalid credentials", []);
    }
  } catch (error) {
    return errorResponse(res, 500, "Failed to login user", error.message);
  }
});

// Register
export const registerUser = asyncHandler(async (req, res) => {
  try {
    const { username, password, fullName, roleId } = req.body;
    const branchId = req.body.branchId || null;
    const userExists = await User.findOne({ username });
    if (userExists) {
      return successResponse(res, 400, "User already exists", []);
    }

    const user = await User.create({
      username,
      password,
      fullName,
      roleId,
      branchId,
    });

    // Generate access token and refresh token for new user
    const createAccessToken = generateAccessToken(user._id);
    const createRefreshToken = generateRefreshToken(user._id);

    // Save refresh token in database
    await refreshToken.create({ userId: user._id, token: createRefreshToken });
    // Save access token in database
    await AccessToken.create({ userId: user._id, token: createAccessToken });

    const userObj = {
      user: {
        username: user.username,
        fullName: user.fullName,
      },
      token: createAccessToken,
    };

    return successResponse(res, 201, "User created successfully.", userObj);
  } catch (error) {
    return errorResponse(res, 500, "Internal server error", error.message);
  }
});

// Profile
export const me = asyncHandler(async (req, res) => {
  try {
    const reqUser = req.user;
    const user = await User.findById(reqUser._id).populate([
      "userInfoId",
      "branchId",
      "roleId",
    ]);
    if (!user) {
      return successResponse(res, 404, "User not found.", []);
    }

    const userInfo = user.toObject({ virtuals: true });

    delete userInfo.password;
    delete userInfo.__v;
    if (userInfo.id) delete userInfo.id;

    if (userInfo.userInfoId) {
      delete userInfo.userInfoId.__v;
      delete userInfo.userInfoId.deleted;
      if (userInfo.userInfoId.id) delete userInfo.userInfoId.id;
      if (userInfo.userInfoId.profilePhoto) {
        const photo = userInfo.userInfoId.profilePhoto;
        if (photo.bucket && photo.filename) {
          userInfo.userInfoId.photoUrl = "/api/user/me/profile/photo";
        }
        delete userInfo.userInfoId.profilePhoto;
      }
    }

    return successResponse(
      res,
      200,
      "User profile get successfully.",
      userInfo
    );
  } catch (error) {
    return errorResponse(res, 500, "Internal server error", error.message);
  }
});

export const resetPasswordByAdmin = asyncHandler(async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword)
      return errorResponse(res, 400, "User ID and new password required.");

    const user = await User.findById(userId);
    if (!user) return errorResponse(res, 404, "User not found.");

    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, "Password reset by admin successful.");
  } catch (error) {
    return errorResponse(res, 500, "Failed to reset password", error.message);
  }
});

export const changePassword = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword)
      return errorResponse(res, 400, "All fields are required.");

    if (newPassword !== confirmPassword)
      return errorResponse(
        res,
        400,
        "New password and confirmation do not match."
      );

    if (currentPassword === newPassword)
      return errorResponse(
        res,
        400,
        "New password is the same current password."
      );

    const user = await User.findById(userId);
    if (!user) return errorResponse(res, 404, "User not found.");

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch)
      return errorResponse(res, 401, "Current password is incorrect.");

    // Update new password
    user.password = newPassword;
    await user.save();

    return successResponse(res, 200, "Password changed successfully.");
  } catch (error) {
    return errorResponse(res, 500, "Failed to change password", error.message);
  }
});
