import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../controllers/role.controller.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Roles
 *     description: Role Module
 */

/**
 * @swagger
 * /api/role:
 *   post:
 *     summary: Create a new role
 *     tags: [Roles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Admin
 *               description:
 *                 type: string
 *                 example: Can access all system features
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: []
 *           examples:
 *             System Administrator Role:
 *               summary: System Administrator Role
 *               value:
 *                 name: System Administrator
 *                 description: "Full system access for system administration and management"
 *                 actions:
 *                   - 507f1f77bcf86cd799439020
 *                   - 507f1f77bcf86cd799439021
 *                   - 507f1f77bcf86cd799439022
 *                   - 507f1f77bcf86cd799439023
 *                   - 507f1f77bcf86cd799439024
 *                   - 507f1f77bcf86cd799439025
 *                   - 507f1f77bcf86cd799439026
 *                   - 507f1f77bcf86cd799439027
 *                   - 507f1f77bcf86cd799439028
 *                   - 507f1f77bcf86cd799439029
 *                   - 507f1f77bcf86cd799439030
 *     responses:
 *       201:
 *         description: Role created successfully, returns action information
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
 *                   example: Action created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 6902f4114157ba26a429fcd6
 *                     name:
 *                       type: string
 *                       example: CREATE_USER
 *                     description:
 *                       type: string
 *                       example: Can create new user
 *                     createdAt:
 *                       type: string
 *                       example: 2025-10-30T05:13:53.303Z
 *                     updatedAt:
 *                       type: string
 *                       example: 2025-10-30T05:13:53.303Z
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: ValidationError
 *                 errors:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: field
 *                         value:
 *                           type: string
 *                           example: CREATE_USER
 *                         msg:
 *                           type: string
 *                           example: CREATE_USER already exists
 *                         path:
 *                           type: string
 *                           example: name
 *                         location:
 *                           type: string
 *                           example: body
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

/**
 * @swagger
 * /api/role:
 *   get:
 *     summary: Get all roles with pagination.
 *     description: Retrieves a paginated list of roles.
 *     tags: [Roles]
 *     responses:
 *       200:
 *         description: Successful response with paginated roles
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router
  .route("/")
  .get(authenticate, authorize(["Admin"]), getRoles)
  .post(authenticate, authorize(["SystemAdmin"]), createRole);

/**
 * @swagger
 * /api/role/{id}:
 *   get:
 *     summary: Get role by ID
 *     description: Retrieve detailed information about a specific role by its unique ID.
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Role ID
 *         required: true
 *         schema:
 *           type: string
 *           example: 64f1b9c2e3b1e8f76a456123
 *     responses:
 *       200:
 *         description: Role details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 64f1b9c2e3b1e8f76a456123
 *                     name:
 *                       type: string
 *                       example: System Administrator
 *                     description:
 *                       type: string
 *                       example: Full system access for system administration
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: user:read
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-10-01T12:00:00.000Z
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-10-10T09:30:00.000Z
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/role/{id}:
 *   put:
 *     summary: Update role by ID
 *     description: Update the details of an existing role. Only users with the **SystemAdmin** role can perform this action.
 *     tags:
 *       - Roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Role ID (MongoDB ObjectId)
 *         required: true
 *         schema:
 *           type: string
 *           example: 64f1b9c2e3b1e8f76a456123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: System Administrator
 *               description:
 *                 type: string
 *                 example: Full system access for system administration and management
 *               actions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: 507f1f77bcf86cd799439022
 *             required:
 *               - name
 *     responses:
 *       200:
 *         description: Role updated successfully
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
 *                   example: Role updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 64f1b9c2e3b1e8f76a456123
 *                     name:
 *                       type: string
 *                       example: System Administrator
 *                     description:
 *                       type: string
 *                       example: Full system access for system administration
 *                     actions:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439022
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-11-12T12:30:00.000Z
 *       400:
 *         description: Bad request — invalid input data
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — only SystemAdmin can update roles
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/role/{id}:
 *   delete:
 *     summary: Delete role by ID
 *     description: Permanently delete a role by its unique ID. Only users with the **SystemAdmin** role can perform this action.
 *     tags:
 *       - Roles 
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Role ID (MongoDB ObjectId)
 *         required: true
 *         schema:
 *           type: string
 *           example: 64f1b9c2e3b1e8f76a456123
 *     responses:
 *       200:
 *         description: Role deleted successfully
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
 *                   example: Role deleted successfully
 *       400:
 *         description: Bad request — invalid role ID
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — only SystemAdmin can delete roles
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

router
  .route("/:id")
  .get(authenticate, getRoleById)
  .put(authenticate, authorize(["SystemAdmin"]), updateRole)
  .delete(authenticate, authorize(["SystemAdmin"]), deleteRole);

export default router;
