import express from "express";
import { body } from "express-validator";
import {
  loginUser,
  registerUser,
  me,
  resetPasswordByAdmin,
  changePassword,
} from "../controllers/auth.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validationError } from "../middlewares/validation.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User Module
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to get access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *           examples:
 *             System Administrator User:
 *               summary: Administrator
 *               description: Login for full access
 *               value:
 *                 username: "admin"
 *                 password: "secure_password"
 *             System User:
 *               summary: User
 *               description: Login with limit access
 *               value:
 *                 username: "user"
 *                 password: "secure_password"
 *     responses:
 *       200:
 *         description: Role created successfully, returns action information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Login successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                           example: admin
 *                         fullName:
 *                           type: string
 *                           example: System Administrator
 *                         roleId:
 *                           type: string
 *                           example: []
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: BadRequest
 *                 message:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: username cannot be empty, spacing, special characters or number
 *                     password:
 *                       type: string
 *                       example: password cannot be empty, less than 6 characters,
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: Unauthorized
 *                 message:
 *                   type: string
 *                   example: Invalid credentials
 *                 roleId:
 *                   type: string
 *                   example: []
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Create a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Administrator
 *               username:
 *                 type: string
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin123
 *           examples:
 *             System Administrator User:
 *               summary: Administrator
 *               description: Default system administrator account with full access
 *               value:
 *                 fullName: System Administrator
 *                 username: "admin"
 *                 password: "secure_password"
 *                 roleId: "507f1f77bcf86cd799439011"
 *                 branchId: "507f1f77bcf86cd799439099"
 *             Normal User:
 *               summary: User
 *               description: Default normal user account with limited access
 *               value:
 *                 fullName: User
 *                 username: "user"
 *                 password: "secure_password"
 *                 roleId: "507f1f77bcf86cd799439011"
 *                 branchId: "507f1f77bcf86cd799439099"
 *     responses:
 *       201:
 *         description: register created successfully, returns register information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: Created
 *                 message:
 *                   type: string
 *                   example: User created successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                           example: admin
 *                         fullName:
 *                           type: string
 *                           example: System Administrator
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: BadRequest
 *                 message:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: username cannot be empty, spacing, special characters or number
 *                     password:
 *                       type: string
 *                       example: password cannot be empty, less than 6 characters,
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: AuthenticationError
 *                 message:
 *                   type: string
 *                   example: Access denied, no token provided
 */
router.post(
  "/register",
  authenticate,
  authorize(["SystemAdmin", "Admin"]),
  registerUser
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the complete profile information of the currently authenticated user including populated role. Excludes sensitive information like passwords...
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successful response user information
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/me", authenticate, me);

/**
 * @swagger
 * /api/auth/reset/change-password:
 *   patch:
 *     summary: user can reset their password by themselves
 *     description: User can change own password by providing old password new password and confirm password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 example: newpassword123
 *               confirmPassword:
 *                 type: string
 *                 example: newpassword123
 *           examples:
 *             User Changing Own Password:
 *               summary: Change Password
 *               description: User changing their own password
 *               value:
 *                 currentPassword: "oldPassword123"
 *                 newPassword: "newPassword123"
 *                 confirmPassword: "newPassword123"
 *     responses:
 *       200:
 *         description: Successful response user information
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch("/reset/change-password", authenticate, changePassword);

/**
 * @swagger
 * /api/auth/reset/admin:
 *   patch:
 *     summary: all user's password can be reset by admin
 *     description: User can not reset their password by themselves, user need to ask admin to reset their password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               newPassword:
 *                 type: string
 *                 example: newPassword123
 *           examples:
 *             Pass Reset By Administrator:
 *               summary: Reset By Admin
 *               description: user's password reset by admin
 *               value:
 *                 userId: "507f1f77bcf86cd799439011"
 *                 newPassword: "secure_password"
 *     responses:
 *       200:
 *         description: Successful response user information
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.patch(
  "/reset/admin",
  authenticate,
  authorize(["SystemAdmin", "Admin"]),
  body("userId")
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid User ID"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long"),
  validationError,
  resetPasswordByAdmin
);

export default router;
