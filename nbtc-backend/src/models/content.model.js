import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const imageSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalname: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    encoding: {
      type: String,
      required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
  }
);

const detailSchema = new mongoose.Schema(
  {
    statement: { type: String, required: true },
    list: {
      type: [String],
      default: [],
    },

    images: {
      type: [imageSchema],
      default: [],
    },
  }
);

const contentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, unique: true },
    description: { type: String, trim: true },
    sort: { type: Number, default: 1 },
    deleted: { type: Boolean, default: false },
    details: {
      type: [detailSchema],
      required: true,
      validate: [(val) => val.length > 0, "At least one detail is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

contentSchema.plugin(mongoosePaginate);

export const ContentModel = mongoose.model("Content", contentSchema);
