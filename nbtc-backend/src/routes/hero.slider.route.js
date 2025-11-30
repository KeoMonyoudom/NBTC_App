import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
// import { validateRequest } from "../middlewares/validation.js";
import { objectIdValidator } from "../validators/id.validator.js";
import {
  createHeroSlider,
  getHeroSliderById,
  getHeroSliders,
  deleteFileById,
} from "../controllers/hero.slider.controller.js";
import { upload } from "../minio/index.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Hero-Slider
 *     description: Hero Slider Management
 */

/**
 * @swagger
 * /api/hero-slider:
 *   post:
 *     summary: Create a new hero slider
 *     description: Allows Admin and Staff users to upload an image and create a hero slider item.
 *     tags:
 *       - Hero-Slider
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Main title of the hero slider
 *                 example: "Welcome to Our Platform"
 *               subtitle:
 *                 type: string
 *                 description: Secondary text below the title
 *                 example: "Empowering Digital Innovation"
 *               link:
 *                 type: string
 *                 description: URL to redirect when slider is clicked
 *                 example: "https://example.com/learn-more"
 *               sort:
 *                 type: number
 *                 description: Sorting order of the slider
 *                 example: 1
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file for the hero slider (uploaded to MinIO)
 *             required:
 *               - title
 *               - file
 *     responses:
 *       201:
 *         description: Hero slider created successfully
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
 *                   example: Hero slider created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 6736f25c9ab7ac77e4c992f1
 *                     title:
 *                       type: string
 *                       example: "Welcome to Our Platform"
 *                     subtitle:
 *                       type: string
 *                       example: "Empowering Digital Innovation"
 *                     link:
 *                       type: string
 *                       example: "https://example.com/learn-more"
 *                     sort:
 *                       type: number
 *                       example: 1
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     image:
 *                       type: object
 *                       properties:
 *                         filename:
 *                           type: string
 *                           example: "slider-123.jpg"
 *                         originalname:
 *                           type: string
 *                           example: "banner.jpg"
 *                         mimetype:
 *                           type: string
 *                           example: "image/jpeg"
 *                         encoding:
 *                           type: string
 *                           example: "7bit"
 *                         bucket:
 *                           type: string
 *                           example: "hero-slider"
 *                         url:
 *                           type: string
 *                           example: "https://minio.myserver.com/hero-slider/slider-123.jpg"
 *                     createdBy:
 *                       type: string
 *                       example: 6736e9839f8c14d6b4bb22f5
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Missing required fields or invalid data
 *       401:
 *         description: Unauthorized — token required
 *       403:
 *         description: Forbidden — only Admin or Staff allowed
 *       500:
 *         description: Server error
 */

router.post(
  "/",
  authenticate,
  authorize(["Admin", "Staff"]),
  upload,
  createHeroSlider
);

/**
 * @swagger
 * /api/hero-slider:
 *   get:
 *     summary: Get all hero sliders
 *     description: Retrieves all hero slider items sorted by the 'sort' field.
 *     tags:
 *       - Hero-Slider
 *     responses:
 *       200:
 *         description: List of hero sliders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: boolean
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: "Data retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 6736f25c9ab7ac77e4c992f1
 *                       title:
 *                         type: string
 *                         example: "Welcome to Our Platform"
 *                       subtitle:
 *                         type: string
 *                         example: "Empowering Digital Innovation"
 *                       link:
 *                         type: string
 *                         example: "https://example.com/learn-more"
 *                       sort:
 *                         type: number
 *                         example: 1
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       image:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                             example: "slider-123.jpg"
 *                           originalname:
 *                             type: string
 *                             example: "banner.jpg"
 *                           mimetype:
 *                             type: string
 *                             example: "image/jpeg"
 *                           encoding:
 *                             type: string
 *                             example: "7bit"
 *                           bucket:
 *                             type: string
 *                             example: "hero-slider"
 *                           url:
 *                             type: string
 *                             example: "https://minio.server.com/hero-slider/slider-123.jpg"
 *                       createdBy:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                             example: "admin"
 *                           fullName:
 *                             type: string
 *                             example: "Alice Admin"
 *                       imageUrl:
 *                         type: string
 *                         example: "/hero-slider/691c01a38ede22d6d0494931"
 *       401:
 *         description: Unauthorized — invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticate, getHeroSliders);

/**
 * @swagger
 * /api/hero-slider/{id}:
 *   get:
 *     summary: Get hero slider image by ID
 *     description: Returns the image file (stream) stored in MinIO.
 *     tags:
 *       - Hero-Slider
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the hero slider
 *     produces:
 *       - image/jpeg
 *       - image/png
 *       - application/octet-stream
 *     responses:
 *       200:
 *         description: Image stream returned successfully
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
 *         description: Image not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */

router.get(
  "/:id",
  // authenticate,
  objectIdValidator("param", "id"),
  getHeroSliderById
);

/**
 * @swagger
 * /api/hero-slider/{id}:
 *   delete:
 *     summary: Delete hero slider by ID
 *     description: Deletes a hero slider including its image file stored in MinIO.
 *     tags: [Hero-Slider]
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
  deleteFileById
);

export default router;
