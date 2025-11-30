import { checkSchema } from "express-validator";
import actionModel from "../models/action.model.js";

export const actionValidator = checkSchema({
  name: {
    in: ["body"],
    trim: true,
    notEmpty: { errorMessage: "This field name cannot be empty" },
    isLength: {
      options: { max: 100 },
      errorMessage: "name must not exceed 30 characters",
    },
    matches: {
      options: [/^[A-Za-z_]+$/],
      errorMessage: "Only letters and underscores are allowed.",
    },
    custom: {
      options: async (value) => {
        const action = await actionModel.findOne({ name: value });
        if (action) {
          throw new Error(`Action: ${value} already exists`);
        }
        return true;
      },
    },
  },
  description: {
    isLength: {
      options: { max: 100 },
    },
    errorMessage: "description must not exceed 100 characters",
  },
});
