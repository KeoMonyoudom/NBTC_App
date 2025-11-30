import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { actionValidator } from "../validators/action.validator.js";
import {validationError} from "../middlewares/validation.js";

import {
  createAction,
  getActions,
  getActionById,
  updateAction,
  deleteAction,
} from "../controllers/action.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Actions
 *     description: Action Module
 */

/**
 * @swagger
 * /api/action:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new action
 *     tags: [Actions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: CREATE
 *               description:
 *                 type: string
 *                 example: Can create
 *           examples:
 *             Create Management Permission:
 *               summary: Create Management Permission
 *               description: Permission to manage create or add new by each roles.
 *               value:
 *                 name: create
 *                 description: Permission to create all data by each roles
 *             Update Management Permission:
 *               summary: Update Management Permission
 *               description: Permission to manage update or edit data by each roles.
 *               value:
 *                 name: update
 *                 description: Permission to update all data by each roles
 *             Delete Management Permission:
 *               summary: Delete Management Permission
 *               description: Permission to manage delete or remove records by each roles.
 *               value:
 *                 name: delete
 *                 description: Permission to delete all data by each roles
 *             Select Management Permission:
 *               summary: Select Management Permission
 *               value:
 *                 name: select
 *                 description: Permission to view data by each roles.
 *     responses:
 *       201:
 *         description: Action created successfully, returns action information
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
 *                       example: create
 *                     description:
 *                       type: string
 *                       example: Permission to create all data by each roles
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
 *                           example: create
 *                         msg:
 *                           type: string
 *                           example: create already exists
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

router.post(
  "/",
  authenticate,
  authorize(["SystemAdmin"]),
  actionValidator,
  validationError,
  createAction
);

router.route("/").get(authenticate, authorize(["SystemAdmin"]), getActions);

router
  .route("/:id")
  .get(authenticate, authorize(["SystemAdmin"]), getActionById)
  .put(authenticate, authorize(["SystemAdmin"]), updateAction)
  .delete(authenticate, authorize(["SystemAdmin"]), deleteAction);

export default router;
