import { param, checkSchema } from "express-validator";
import mongoose from "mongoose";

function isValidTime(t) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
}

// Validator for update event
export const updateEventValidator = [
  // ✅ Validate event ID in URL
  param("id")
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage("Invalid Event ID"),

  // ✅ Validate body fields (all optional)
  checkSchema({
    title: {
      optional: true,
      notEmpty: { errorMessage: "Title cannot be empty" },
    },

    dateFrom: {
      optional: true,
      isISO8601: { errorMessage: "dateFrom must be a valid date (YYYY-MM-DD)" },
      custom: {
        options: (value, { req }) => {
          if (!req.body.dateTo) return true;
          const fromDate = new Date(value);
          const toDate = new Date(req.body.dateTo);
          if (isNaN(fromDate) || isNaN(toDate)) return true;
          if (fromDate > toDate) throw new Error("dateFrom must be earlier than dateTo");
          return true;
        },
      },
    },

    dateTo: {
      optional: true,
      isISO8601: { errorMessage: "dateTo must be a valid date (YYYY-MM-DD)" },
      custom: {
        options: (value, { req }) => {
          if (!req.body.dateFrom) return true;
          const fromDate = new Date(req.body.dateFrom);
          const toDate = new Date(value);
          if (isNaN(fromDate) || isNaN(toDate)) return true;
          if (fromDate > toDate) throw new Error("dateFrom must be earlier than dateTo");
          return true;
        },
      },
    },

    timeFrom: {
      optional: true,
      custom: {
        options: (value) => {
          if (!isValidTime(value)) throw new Error("timeFrom must be in HH:mm format");
          return true;
        },
      },
    },

    timeTo: {
      optional: true,
      custom: {
        options: (value, { req }) => {
          const from = req.body.timeFrom;
          if (!isValidTime(value)) throw new Error("timeTo must be in HH:mm format");
          if (!from || !isValidTime(from)) return true;

          const [fh, fm] = from.split(":").map(Number);
          const [th, tm] = value.split(":").map(Number);
          if (fh > th || (fh === th && fm >= tm)) {
            throw new Error("timeFrom must be earlier than timeTo");
          }
          return true;
        },
      },
    },

    description: {
      optional: true,
      isString: { errorMessage: "description must be string" },
    },

    map: { optional: true },
    urlImage: { optional: true },

    contactPerson: { optional: true },
    "contactPerson.name": {
      optional: true,
      notEmpty: { errorMessage: "contactPerson.name cannot be empty" },
    },
    "contactPerson.phone": {
      optional: true,
      notEmpty: { errorMessage: "contactPerson.phone cannot be empty" },
    },
    "contactPerson.email": {
      optional: true,
      isEmail: { errorMessage: "contactPerson.email must be a valid email" },
    },
  }),
];
