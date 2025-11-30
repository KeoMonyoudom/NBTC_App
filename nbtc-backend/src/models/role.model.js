import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    actions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Action" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roleSchema.plugin(mongoosePaginate);

export default mongoose.model("Role", roleSchema);
