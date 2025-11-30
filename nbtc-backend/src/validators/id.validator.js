import { body, param, query } from "express-validator";
import mongoose from "mongoose";

/**
 * Returns a validator for a field to check if it's a valid MongoDB ObjectId.
 * @param {string} location - 'body' | 'param' | 'query'
 * @param {string} fieldName - Name of the field to validate
 */
export const objectIdValidator = (location, fieldName) => {
  switch (location) {
    case "body":
      return body(fieldName)
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage(`${fieldName} must be a valid MongoDB ObjectId`);
    case "param":
      return param(fieldName)
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage(`${fieldName} must be a valid MongoDB ObjectId`);
    case "query":
      return query(fieldName)
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage(`${fieldName} must be a valid MongoDB ObjectId`);
    default:
      throw new Error("Invalid location for ObjectId validator");
  }
};
