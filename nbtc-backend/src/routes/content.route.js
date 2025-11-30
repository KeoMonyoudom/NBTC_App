import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { validateRequest } from "../middlewares/validation.js";
import { objectIdValidator } from "../validators/id.validator.js";
import {
  createContent,
  deleteContentById,
  getContentImageById,
  getContents,
} from "../controllers/content.controller.js";
import { uploads } from "../minio/index.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Contents
 *     description: Blood Donation Information
 */

/**
 * @swagger
 * /api/content:
 *   post:
 *     summary: Create content with uploaded images
 *     tags: [Contents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               sort:
 *                 type: number
 *               statement:
 *                 type: string
 *               list:
 *                 type: array
 *                 items:
 *                   type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload image files
 *     responses:
 *       201:
 *         description: Content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

router.post(
  "/",
  authenticate,
  authorize(["Admin", "Staff"]),
  uploads,
  createContent
);

/**
 * @swagger
 * /api/content:
 *   get:
 *     summary: Get all content records
 *     description: Retrieve all content with details, lists, and image metadata.
 *     tags: [Contents]
 *     responses:
 *       200:
 *         description: Successfully retrieved all content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: number
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Content'
 *       500:
 *         description: Internal server error
 */

router.get("/", authenticate, getContents);

/**
 * @swagger
 * /api/content/{id}:
 *   delete:
 *     summary: Delete hero slider by ID
 *     description: Deletes a hero slider including its image file stored in MinIO.
 *     tags: [Contents]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB ObjectId of the Hero Slider
 *         schema:
 *           type: string
 *           example: 679a4a00c2e3b0d3f2d113b2
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   example: File deleted successfully.
 *       400:
 *         description: Invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *       403:
 *         description: Forbidden - insufficient role permissions
 *       404:
 *         description: Hero slider not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  authenticate,
  authorize(["Admin", "Staff"]),
  objectIdValidator("param", "id"),
  deleteContentById
);

/**
 * @swagger
 * /api/content/{contentId}/details/{detailId}/images/{imageId}:
 *   get:
 *     summary: Get image file from content details by image ID
 *     description: Returns the image file stored in MinIO for a specific detail inside a content entry.
 *     tags: [Contents]
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         description: ID of the content document
 *         schema:
 *           type: string
 *           example: 691ea5003d32dd25ae39b71e
 *       - in: path
 *         name: detailId
 *         required: true
 *         description: ID of the detail inside the content
 *         schema:
 *           type: string
 *           example: 691ea5003d32dd25ae39b71f
 *       - in: path
 *         name: imageId
 *         required: true
 *         description: ID of the image object inside the detail
 *         schema:
 *           type: string
 *           example: 691ea5003d32dd25ae39b720
 *     produces:
 *       - image/jpeg
 *       - image/png
 *       - application/octet-stream
 *     responses:
 *       200:
 *         description: Image file stream
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Content, detail or image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       500:
 *         description: Internal server error
 */

router.get(
  "/:contentId/details/:detailId/images/:imageId",
  getContentImageById
);

export default router;
