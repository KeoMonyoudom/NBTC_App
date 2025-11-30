/**
 * Node modules
 */
import { Schema, model } from "mongoose";

/**
 * User schema
 */
const personalAccessTokenSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      unique: true,
      ref: "User",
    },
    token: {
      type: String,
      required: [true, "Token is required"],
    },
  },
  {
    timestamps: true,
  }
);

export default model("personal_access_token", personalAccessTokenSchema);
