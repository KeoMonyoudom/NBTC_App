import asyncHandler from "express-async-handler";
import Action from "../models/action.model.js";

// Create
export const createAction = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    const action = await Action.create({ name, description });
    const actionObj = action.toObject();
    delete actionObj.__v;
    delete actionObj._id;

    res.status(201).json({
      code: "Created",
      message: "Action created successfully",
      data: actionObj,
    });
  } catch (error) {
    res.status(500).json({
      code: "ServerError",
      message: "Internal server error",
      error: err,
    });
  }
});

// Read all
export const getActions = asyncHandler(async (req, res) => {
  const actions = await Action.find();
  res.json(actions);
});

// Read one
export const getActionById = asyncHandler(async (req, res) => {
  const action = await Action.findById(req.params.id);
  if (!action) {
    res.status(404);
    throw new Error("Action not found");
  }
  res.json(action);
});

// Update
export const updateAction = asyncHandler(async (req, res) => {
  const action = await Action.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  res.json(action);
});

// Delete
export const deleteAction = asyncHandler(async (req, res) => {
  await Action.findByIdAndDelete(req.params.id);
  res.json({ message: "Action deleted" });
});
