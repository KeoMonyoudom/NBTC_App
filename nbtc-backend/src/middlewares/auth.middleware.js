import jwt from "jsonwebtoken";
import { verifyAccessToken } from "../lib/jwt.js";
import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";
import { successResponse, errorResponse } from "../utils/response.handler.js";

const { TokenExpiredError, JsonWebTokenError } = jwt;
export const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token)
    return res.status(401).json({
      code: "AuthenticationError",
      message: "Access denied, no token provided",
    });

  try {
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).populate({
      path: "roleId",
      populate: { path: "actions" },
    });
    console.log(decoded);
    if (!user)
      return successResponse(
        res,
        401,
        "Access denied. This user not found in database.",
        []
      );

    if (!user.isActive)
      return successResponse(res, 403, "User is inactive.", []);

    const userDoc = user.toObject();
    delete userDoc.__v;
    delete userDoc.password;

    req.user = userDoc;
    next();
  } catch (err) {
    // Handle expired token error
    if (err instanceof TokenExpiredError) {
      return errorResponse(
        res,
        401,
        {
          code: "AuthenticationError",
          message: "Access token expired, request a new one with refresh token",
        },
        err
      );
    }

    // Handle invalid token error
    if (err instanceof JsonWebTokenError) {
      return errorResponse(
        res,
        401,
        {
          code: "AuthenticationError",
          message: "Access token invalid",
        },
        err
      );
    }

    // Catch-all for other errors
    return errorResponse(
      res,
      500,
      {
        code: "ServerError",
        message: "Internal server error with verifying token",
      },
      err
    );
  }
});

// Role-based permission
// export const authorize = asyncHandler(async (requiredAction) => {
//   return (req, res, next) => {
//     if (!req.user || !req.user.roleId) {
//       return successResponse(res, 403, "Forbidden", []);
//     }

//     const hasAction = req.user.roleId.actions.some(
//       (a) => a.name === requiredAction
//     );
//     if (!hasAction) return successResponse(res, 403, "Forbidden", []);

//     next();
//   };
// });

export const authorize = (roles = []) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.roleId || user.roleId.length === 0) {
        return successResponse(
          res,
          403,
          "Access denied. No roles assigned.",
          []
        );
      }

      // Extract role names (handle case where roleId is array of objects)
      const userRoles = user.roleId.map((role) => role.name);

      // ✅ If user has SystemAdmin role → always allow
      if (userRoles.includes("SystemAdmin")) {
        return next();
      }

      // Check if any user role matches allowed roles
      // const hasAccess = roles.some((role) => userRoles.includes(role));
      const hasAccess = roles.some((role) =>
        userRoles.map((r) => r.toLowerCase()).includes(role.toLowerCase())
      );

      if (!hasAccess) {
        return successResponse(
          res,
          403,
          `Access denied. This route requires one of: [${roles.join(", ")}]`,
          []
        );
      }

      return next();
    } catch (err) {
      return errorResponse(
        res,
        500,
        {
          code: "ServerError",
          message: "Internal server error with authorizing user roles",
        },
        err
      );
    }
  };
};
