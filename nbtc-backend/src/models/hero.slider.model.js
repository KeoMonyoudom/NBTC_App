import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const heroSliderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    image: {
      filename: String,
      originalname: String,
      path: String,
      mimetype: String,
      encoding: String,
      bucket: String,
      url: String,
    },
    link: String,
    sort: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

heroSliderSchema.plugin(mongoosePaginate);

export const HeroSliderModel = mongoose.model("HeroSlider", heroSliderSchema);
