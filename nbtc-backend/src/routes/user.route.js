import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { uploadSingle } from "../minio/index.js";
import {
  getUsers,
  getUserInfoById,
  updateUser,
  deleteUser,
  createUser,
  createUserProfile,
  getUserInfo,
  updateUserProfile,
  updateSelfProfile,
  updateSelfPhoto,
  getSelfPhoto,
} from "../controllers/user.controller.js";
import { userValidator } from "../validators/user.validator.js";
import { validateRequest } from "../middlewares/validation.js";
import { userInfoValidator } from "../validators/user.info.validator.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User Module
 */

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get all users with pagination, sorting, and filtering
 *     description: Retrieves a paginated list of users with optional search, role filtering, branch filtering, and status filtering capabilities.
 *     tags: [Users]
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Number of users to return per page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *       - name: page
 *         in: query
 *         description: page number
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Successful response with paginated users
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/", authenticate, authorize(["Admin"]), getUsers);
/**
 * @swagger
 * /api/user/register-with-info:
 *   post:
 *     summary: create a new user with user info
 *     description: this route for general use, no authentication or authorization need.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: cadt
 *               fullName:
 *                 type: string
 *                 example: Cambodia Academy of Digital Technology
 *               password:
 *                 type: string
 *                 example: cadt123
 *                 description: password at least 6 or more
 *               roleId:
 *                 type: array
 *                 example: []
 *               branchId:
 *                 type: string
 *                 example: null
 *               userInfo:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: CADT
 *                     example: John
 *                   lastName:
 *                     type: string
 *                     example: CADT
 *                   gender:
 *                     type: string
 *                     enum: [M, F, Other]
 *                     example: Other
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *                     example: 1990-01-01
 *                   maritalStatus:
 *                     type: string
 *                     enum: [Single, Married, Divorced, Widowed, Other]
 *                     example: Other
 *                   occupation:
 *                     type: string
 *                     example: Digital and Technology
 *                   address:
 *                     type: string
 *                     example: "123 Main St"
 *                   phoneNumber:
 *                     type: string
 *                     example: 012-456-789
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: info@cadt.gov.kh
 *                   identifications:
 *                     type: object
 *                     properties:
 *                       cardType:
 *                         type: string
 *                         example: "CADT Card"
 *                       cardCode:
 *                         type: string
 *                         example: "123456789"
 *             required:
 *               - username
 *               - fullName
 *               - password
 *               - userInfo
 *     responses:
 *       200:
 *         description: Successful response with paginated users
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/register-with-info", userValidator, validateRequest, createUser);
/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Create a new user information profile with no user account. this route can create with user information only.
 *     description: Allows **Admin** and **Staff** users to create a new user info profile record.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               gender:
 *                 type: string
 *                 enum: [M, F, Other]
 *                 example: M
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1995-05-12
 *               maritalStatus:
 *                 type: string
 *                 enum: [Single, Married, Divorced, Widowed, Other]
 *                 example: Other
 *               occupation:
 *                 type: string
 *                 example: Digital and Technology
 *               address:
 *                 type: string
 *                 example: "123 Main St"
 *               phoneNumber:
 *                 type: string
 *                 example: "+85512345678"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: info@cadt.gov.kh
 *               identifications:
 *                 type: object
 *                 properties:
 *                   cardType:
 *                     type: string
 *                     example: "CADT Card"
 *                   cardCode:
 *                     type: string
 *                     example: "123456789"
 *             required:
 *               - firstName
 *               - lastName
 *               - gender
 *     responses:
 *       201:
 *         description: User info profile created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User information profile created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 64f1b9c2e3b1e8f76a456111
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     gender:
 *                       type: string
 *                       enum: [M, F, Other]
 *                       example: M
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                       example: 1995-05-12
 *                     maritalStatus:
 *                       type: string
 *                       enum: [Single, Married, Divorced, Widowed, Other]
 *                       example: Other
 *                     occupation:
 *                       type: string
 *                       example: Digital and Technology
 *                     address:
 *                       type: string
 *                       example: "123 Main St"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+85512345678"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: info@cadt.gov.kh
 *                     identifications:
 *                       type: array
 *                       properties:
 *                         cardType:
 *                           type: string
 *                           example: "CADT Card"
 *                         cardCode:
 *                           type: string
 *                           example: "123456789"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-11-12T12:00:00.000Z
 *       400:
 *         description: Validation error or missing required fields
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — only Admin or Staff can access
 *       500:
 *         description: Server error
 */
router.post(
  "/register",
  authenticate,
  authorize(["Admin", "Staff"]),
  userInfoValidator,
  validateRequest,
  createUserProfile
);

/**
 * @swagger
 * /api/user/{userInfoId}:
 *   get:
 *     summary: Get user information profile by ID
 *     description: Retrieves a user information profile by its ID, including related user data such as branch, role, username, and full name.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userInfoId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user information profile
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User profile get successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 64f1b9c2e3b1e8f76a456111
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     gender:
 *                       type: string
 *                       enum: [M, F, Other]
 *                       example: M
 *                     dateOfBirth:
 *                       type: string
 *                       format: date
 *                       example: 1995-05-12
 *                     maritalStatus:
 *                       type: string
 *                       enum: [Single, Married, Divorced, Widowed, Other]
 *                       example: Other
 *                     occupation:
 *                       type: string
 *                       example: Digital and Technology
 *                     address:
 *                       type: string
 *                       example: "123 Main St"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+85512345678"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: info@cadt.gov.kh
 *                     identifications:
 *                       type: object
 *                       properties:
 *                         cardType:
 *                           type: string
 *                           example: "CADT Card"
 *                         cardCode:
 *                           type: string
 *                           example: "123456789"
 *                     branchId:
 *                       type: object
 *                       description: Populated branch info
 *                     roleId:
 *                       type: array
 *                       items:
 *                         type: object
 *                       description: Populated roles
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     fullName:
 *                       type: string
 *                       example: John Doe
 *       400:
 *         description: Invalid user info ID
 *       404:
 *         description: User info not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/user/user-info:
 *   get:
 *     summary: Get all user information with pagination.
 *     description: Retrieves a paginated list of user information.
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Successful response with paginated user information
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.get(
  "/user-info",
  authenticate,
  authorize(["Admin", "Staff"]),
  getUserInfo
);

/**
 * @swagger
 * /api/user/user-info/{id}:
 *   put:
 *     summary: Update user information by ID
 *     description: Updates an existing user information profile.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User info ID to update
 *         schema:
 *           type: string
 *           example: 6736e9839f8c14d6b4bb22f5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: chanmady
 *               lastName:
 *                 type: string
 *                 example: chab
 *               gender:
 *                 type: string
 *                 enum: [M, F, Other]
 *                 example: M
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1992-05-12T00:00:00.000Z
 *               maritalStatus:
 *                 type: string
 *                 enum: [Single, Married, Divorced, Widowed, Other]
 *                 example: Married
 *               occupation:
 *                 type: string
 *                 example: Digital and Technology
 *               address:
 *                 type: string
 *                 example: 123 Main St
 *               phoneNumber:
 *                 type: string
 *                 example: +85512345678
 *               email:
 *                 type: string
 *                 format: email
 *                 example: chabchanmady@gmail.com
 *               identifications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     cardType:
 *                       type: string
 *                       example: CADT Card
 *                     cardCode:
 *                       type: string
 *                       example: 123456781
 *     responses:
 *       200:
 *         description: User information updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User information updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 6736e9839f8c14d6b4bb22f5
 *                     firstName:
 *                       type: string
 *                       example: chanmady
 *                     lastName:
 *                       type: string
 *                       example: chab
 *                     gender:
 *                       type: string
 *                       example: M
 *                     dateOfBirth:
 *                       type: string
 *                       example: 1992-05-12T00:00:00.000Z
 *                     maritalStatus:
 *                       type: string
 *                       example: Married
 *                     occupation:
 *                       type: string
 *                       example: Digital and Technology
 *                     address:
 *                       type: string
 *                       example: 123 Main St
 *                     phoneNumber:
 *                       type: string
 *                       example: +85512345678
 *                     email:
 *                       type: string
 *                       example: chabchanmady@gmail.com
 *                     identifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           cardType:
 *                             type: string
 *                             example: CADT Card
 *                           cardCode:
 *                             type: string
 *                             example: 123456781
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User info not found
 *       500:
 *         description: Server error
 */

router.put(
  "/user-info/:id",
  authenticate,
  authorize(["Admin", "Staff"]),
  updateUserProfile
);

router.get(
  "/:userInfoId",
  authenticate,
  authorize(["Admin", "Staff"]),
  getUserInfoById
);

router
  .route("/:id")
  .put(authenticate, authorize(["Admin", "Staff"]), updateUser)
  .delete(authenticate, authorize(["Admin", "Staff"]), deleteUser);

router.patch("/me/profile", authenticate, updateSelfProfile);
router.patch(
  "/me/profile/photo",
  authenticate,
  uploadSingle("photo"),
  updateSelfPhoto
);
router.get("/me/profile/photo", authenticate, getSelfPhoto);

export default router;
