import { checkSchema } from "express-validator";

function isValidTime(t) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);
}

export const eventValidator = checkSchema({
  title: {
    notEmpty: { errorMessage: "Title is required" },
  },

  dateFrom: {
    notEmpty: { errorMessage: "dateFrom is required" },
    isISO8601: { errorMessage: "dateFrom must be a valid date (YYYY-MM-DD)" },
  },

  dateTo: {
    notEmpty: { errorMessage: "dateTo is required" },
    isISO8601: { errorMessage: "dateTo must be a valid date (YYYY-MM-DD)" },

    // Compare dateFrom < dateTo
    custom: {
      options: (value, { req }) => {
        const from = req.body.dateFrom;
        if (!from) return true; // other validator will catch it

        const fromDate = new Date(from);
        const toDate = new Date(value);

        if (isNaN(fromDate) || isNaN(toDate)) return true; // let date validator handle format errors

        if (fromDate > toDate) {
          throw new Error("dateFrom must be earlier than dateTo");
        }

        return true;
      },
    },
  },

  timeFrom: {
    notEmpty: { errorMessage: "timeFrom is required" },
    custom: {
      options: (value) => {
        if (!isValidTime(value)) {
          throw new Error("timeFrom must be in HH:mm format");
        }
        return true;
      },
    },
  },

  timeTo: {
    notEmpty: { errorMessage: "timeTo is required" },
    custom: {
      options: (value, { req }) => {
        const from = req.body.timeFrom;

        if (!isValidTime(value)) {
          throw new Error("timeTo must be in HH:mm format");
        }
        if (!isValidTime(from)) {
          return true; // timeFrom validator will handle error
        }

        // Compare only if same date
        // if (req.body.dateFrom && req.body.dateFrom === req.body.dateTo) {
        //   const [fh, fm] = from.split(":").map(Number);
        //   const [th, tm] = value.split(":").map(Number);

        //   if (fh > th || (fh === th && fm >= tm)) {
        //     throw new Error("timeFrom must be earlier than timeTo");
        //   }
        // }

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
    notEmpty: { errorMessage: "contactPerson.name is required" },
  },
  "contactPerson.phone": {
    notEmpty: { errorMessage: "contactPerson.phone is required" },
  },
  "contactPerson.email": {
    optional: true,
    isEmail: { errorMessage: "contactPerson.email must be a valid email" },
  },
});
