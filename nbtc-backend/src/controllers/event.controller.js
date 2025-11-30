// controllers/eventController.js
import asyncHandler from "express-async-handler";
import { EventModel } from "../models/event.model.js";
import { errorResponse, successResponse } from "../utils/response.handler.js";

// CREATE EVENT
export const createEvent = asyncHandler(async (req, res) => {
  try {
    const eventData = req.body;
    eventData.createdBy = req.user._id;
    const event = await EventModel.create(eventData);

    const populatedEvent = await EventModel.findById(event._id)
      .populate({
        path: "createdBy",
        select: "username fullName",
      })
      .lean();

    delete populatedEvent.__v;

    return successResponse(
      res,
      201,
      "Event created successfully",
      populatedEvent
    );
  } catch (error) {
    errorResponse(res, 500, "Failed to create Event", error.message);
  }
});

// GET ALL EVENTS (with pagination)
export const getEvents = asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || process.env.DEFAULT_PAGE_SIZE;
    const page = parseInt(req.query.page) || 1;
    const { startDate, endDate, isCanceled, byEventId, sort } = req.query;

    const filter = {};
    // Sorting only user schema fields
    let sortOptions = { createdAt: -1 };
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

    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.dateFrom.$gte = new Date(startDate);
      if (endDate) filter.dateTo.$lte = new Date(endDate);
    }

    if (isCanceled) {
      filter.isCanceled = isCanceled === "true";
    }

    if (byEventId) {
      filter._id = byEventId;
    }

    // get data from EventModel with pagination User model and populate createdBy field using mongoose paginate v2
    const populateOptions = { path: "createdBy", select: "username fullName" };
    const options = {
      page,
      limit,
      sort: sortOptions,
      populate: populateOptions,
      select: "-__v",
      lean: true,
    };
    const result = await EventModel.paginate(filter, options);
    return successResponse(res, 200, "Events retrieved successfully", result);
  } catch (error) {
    return errorResponse(res, 500, "Failed to get events", error.message);
  }
});

// UPDATE EVENT
export const updateEvent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    // Set who updated this event
    updateData.updatedBy = req.user._id;

    // Find and update event
    const updatedEvent = await EventModel.findByIdAndUpdate(id, updateData, {
      new: true, // return the updated document
    })
      .populate({
        path: "createdBy",
        select: "username fullName -_id",
      })
      .populate({
        path: "updatedBy",
        select: "username fullName -_id",
      })
      .lean();

    if (!updatedEvent) {
      return errorResponse(res, 404, "Event not found");
    }
    delete updatedEvent.__v;
    return successResponse(
      res,
      200,
      "Event updated successfully",
      updatedEvent
    );
  } catch (error) {
    return errorResponse(res, 500, "Failed to update event", error.message);
  }
});

// DELETE EVENT
export const deleteEvent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    // 1️⃣ Validate ObjectId
    if (!id) {
      return errorResponse(res, 400, "Invalid Event ID");
    }

    // 2️⃣ Find event
    const event = await EventModel.findById(id);
    if (!event) {
      return errorResponse(res, 404, "Event not found");
    }

    // 3️⃣ Soft delete
    event.isCanceled = true;
    event.updatedBy = req.user._id;
    event.updatedAt = new Date();

    const updatedEvent = await event.save();

    // Check save success
    if (!updatedEvent || !updatedEvent._id) {
      return errorResponse(res, 500, "Failed to update event");
    }

    return successResponse(res, 200, "Event canceled successfully", []);
  } catch (error) {
    return errorResponse(res, 500, "Failed to delete event", error.message);
  }
});

export const getEventById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    // 1️⃣ Validate ObjectId
    if (!id) {
      return errorResponse(res, 400, "Invalid Event ID");
    }

    // 2️⃣ Find event
    const event = await EventModel.findById(id)
      .select("-__v")
      .populate({
        path: "createdBy",
        select: "username fullName -_id",
      })
      .populate({
        path: "updatedBy",
        select: "username fullName -_id",
      });
    if (!event) {
      return errorResponse(res, 404, "Event not found");
    }

    return successResponse(res, 200, "Get event by id successfully", event);
  } catch (error) {
    return errorResponse(res, 500, "Failed to get event by id", error.message);
  }
});
