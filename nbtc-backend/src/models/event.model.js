import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    // Date range
    dateFrom: { type: Date, required: true },
    dateTo: { type: Date, required: true },

    // Time range
    timeFrom: { type: String, required: true }, // HH:mm format
    timeTo: { type: String, required: true },

    description: { type: String },

    map: { type: String }, // Google map link or location text
    urlImage: { type: String }, // Image URL

    contactPerson: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String },
    },

    // Who created this event
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isCanceled: { type: Boolean, default: false },
  },
  { timestamps: true }
);
eventSchema.plugin(mongoosePaginate);

export const EventModel = mongoose.model("Event", eventSchema);
