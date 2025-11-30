import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { eventValidator } from "../validators/event.validator.js";
import { validateRequest } from "../middlewares/validation.js";
import {
  createEvent,
  deleteEvent,
  getEventById,
  getEvents,
  updateEvent,
} from "../controllers/event.controller.js";
import { updateEventValidator } from "../validators/event.update.validator.js";
import { objectIdValidator } from "../validators/id.validator.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: Event Module
 */

/**
 * @swagger
 * /api/event:
 *   post:
 *     tags:
 *       - Events
 *     summary: Create a new event
 *     description: |
 *       Create a new event.
 *       - **Authentication required (Bearer Token)**
 *       - Only users with role **Admin** or **Staff** can create an event.
 *       - `createdBy` is taken from the authenticated user automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - dateFrom
 *               - dateTo
 *               - timeFrom
 *               - timeTo
 *               - contactPerson
 *             properties:
 *               title:
 *                 type: string
 *                 example: Developer Workshop
 *               dateFrom:
 *                 type: string
 *                 format: date
 *                 example: 2025-11-20
 *               dateTo:
 *                 type: string
 *                 format: date
 *                 example: 2025-11-21
 *               timeFrom:
 *                 type: string
 *                 example: "09:00"
 *               timeTo:
 *                 type: string
 *                 example: "16:00"
 *               description:
 *                 type: string
 *                 example: A workshop for junior developers.
 *               map:
 *                 type: string
 *                 example: https://maps.google.com/?q=Phnom+Penh
 *               urlImage:
 *                 type: string
 *                 example: https://example.com/event-image.jpg
 *               contactPerson:
 *                 type: object
 *                 required:
 *                   - name
 *                   - phone
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: Chan Mady
 *                   phone:
 *                     type: string
 *                     example: "+85598765432"
 *                   email:
 *                     type: string
 *                     example: "contact@example.com"
 *
 *     responses:
 *       201:
 *         description: Event created successfully
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
 *                   example: Event created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 6725f99fae3ff8455b0f424a
 *                     title:
 *                       type: string
 *                       example: Developer Workshop
 *                     dateFrom:
 *                       type: string
 *                       example: 2025-11-20T00:00:00.000Z
 *                     dateTo:
 *                       type: string
 *                       example: 2025-11-21T00:00:00.000Z
 *                     timeFrom:
 *                       type: string
 *                       example: "09:00"
 *                     timeTo:
 *                       type: string
 *                       example: "16:00"
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                           example: admin_user
 *                         fullName:
 *                           type: string
 *                           example: System Administrator
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - User not allowed
 *       500:
 *         description: Server error
 */

router.post(
  "/",
  authenticate,
  authorize(["Admin", "Staff"]),
  eventValidator,
  validateRequest,
  createEvent
);

/**
 * @swagger
 * /api/event:
 *   get:
 *     tags:
 *       - Events
 *     summary: Get paginated list of events with filters
 *     description: |
 *       Retrieve events with optional filtering and pagination.
 *       - Authentication required (Bearer Token).
 *       - All users can see events.
 *       - Supports filtering by date range, cancellation status, and specific event ID.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events starting from this date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter events ending by this date (YYYY-MM-DD)
 *       - in: query
 *         name: isCanceled
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by canceled status
 *       - in: query
 *         name: byEventId
 *         schema:
 *           type: string
 *         description: Filter by specific event ID
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: dateFrom:desc
 *         description: "Sort events, format: field:asc|desc (e.g., dateFrom:desc)"
 *     responses:
 *       200:
 *         description: Events fetched successfully
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
 *                   example: Events fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       dateFrom:
 *                         type: string
 *                         format: date
 *                       dateTo:
 *                         type: string
 *                         format: date
 *                       timeFrom:
 *                         type: string
 *                       timeTo:
 *                         type: string
 *                       isCanceled:
 *                         type: boolean
 *                       createdBy:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                           fullName:
 *                             type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     totalDocs:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     hasNextPage:
 *                       type: boolean
 *                     hasPrevPage:
 *                       type: boolean
 *                     nextPage:
 *                       type: integer
 *                     prevPage:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - User not allowed
 *       500:
 *         description: Server error
 */

router.get("/", authenticate, getEvents);

/**
 * @swagger
 * /api/event/{id}:
 *   put:
 *     tags:
 *       - Events
 *     summary: Update an existing event
 *     description: |
 *       Update an event by ID. Only fields provided in the request body will be updated.
 *       - Authentication required (Bearer Token).
 *       - Only users with role **Admin** or **Staff** can update events.
 *       - Validations applied:
 *         - `dateFrom` must be earlier than `dateTo` (if both provided)
 *         - `timeFrom` must be earlier than `timeTo` (if both provided)
 *         - `contactPerson.email` must be a valid email
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID (must be a valid MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Workshop
 *               dateFrom:
 *                 type: string
 *                 format: date
 *                 example: 2025-11-20
 *               dateTo:
 *                 type: string
 *                 format: date
 *                 example: 2025-11-21
 *               timeFrom:
 *                 type: string
 *                 example: 09:00
 *               timeTo:
 *                 type: string
 *                 example: 16:00
 *               description:
 *                 type: string
 *                 example: "Updated description of the event"
 *               map:
 *                 type: string
 *                 example: "123 Main St, City"
 *               urlImage:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               contactPerson:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *                   phone:
 *                     type: string
 *                     example: "+85512345678"
 *                   email:
 *                     type: string
 *                     example: "contact@example.com"
 *     responses:
 *       200:
 *         description: Event updated successfully
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
 *                   example: Event updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     dateFrom:
 *                       type: string
 *                       format: date
 *                     dateTo:
 *                       type: string
 *                       format: date
 *                     timeFrom:
 *                       type: string
 *                     timeTo:
 *                       type: string
 *                     description:
 *                       type: string
 *                     map:
 *                       type: string
 *                     urlImage:
 *                       type: string
 *                     contactPerson:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                     updatedBy:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error (invalid data or ID)
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - User role not allowed
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authenticate,
  authorize(["Admin", "Staff"]),
  updateEventValidator,
  validateRequest,
  updateEvent
);

/**
 * @swagger
 * /api/event/{id}:
 *   delete:
 *     summary: Soft delete (cancel) an event
 *     description: |
 *       Marks an event as canceled by setting `isCanceled = true`,
 *       and tracks who updated it via `updatedBy` and timestamp.
 *       Requires authentication and Admin/Staff role.
 *
 *     tags: [Events]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "677fd518a91ff9e715aee1cc"
 *         description: MongoDB ObjectId of the event to delete
 *
 *     responses:
 *       200:
 *         description: Event canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: Updated
 *                 message:
 *                   type: string
 *                   example: Event canceled successfully
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *
 *       400:
 *         description: Validation error (invalid ID format)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: ValidationError
 *                 message:
 *                   type: string
 *                   example: Invalid request parameters
 *
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: NotFound
 *                 message:
 *                   type: string
 *                   example: Event not found
 *
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: ServerError
 *                 message:
 *                   type: string
 *                   example: Failed to delete event
 */

router.delete(
  "/:id",
  authenticate,
  authorize(["Admin", "Staff"]),
  objectIdValidator("param", "id"),
  validateRequest,
  deleteEvent
);

/**
 * @swagger
 * /api/event/{id}:
 *   get:
 *     summary: get event by id
 *     description: |
 *       Requires authentication.
 *       All users can get this event by id.
 *       No need authorization.
 *
 *     tags: [Events]
 *
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "677fd518a91ff9e715aee1cc"
 *         description: MongoDB ObjectId of the event to delete
 *
 *     responses:
 *       200:
 *         description: Event canceled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: Updated
 *                 message:
 *                   type: string
 *                   example: Event canceled successfully
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *
 *       400:
 *         description: Validation error (invalid ID format)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: ValidationError
 *                 message:
 *                   type: string
 *                   example: Invalid request parameters
 *
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: NotFound
 *                 message:
 *                   type: string
 *                   example: Event not found
 *
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                   example: ServerError
 *                 message:
 *                   type: string
 *                   example: Failed to delete event
 */
router.get(
  "/:id",
  authenticate,
  objectIdValidator("param", "id"),
  validateRequest,
  getEventById
);

export default router;
