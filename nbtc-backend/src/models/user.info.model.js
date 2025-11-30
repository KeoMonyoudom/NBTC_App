import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const identificationSchema = new mongoose.Schema(
  {
    cardType: String,
    cardCode: String,
  },
  { _id: false }
);

const userInfoSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: {
      type: String,
      required: true,
      enum: {
        values: ["M", "F", "Other"],
        message: "{VALUE} is not supported",
      },
    },
    dateOfBirth: { type: Date, required: true },
    maritalStatus: {
      type: String,
      required: true,
      enum: {
        values: ["Single", "Married", "Divorced", "Widowed", "Other"],
        message: "{VALUE} is not supported",
      },
    },
    occupation: { type: String, required: true },
    address: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, unique: true },
    profilePhoto: {
      bucket: String,
      filename: String,
      originalname: String,
      mimetype: String,
    },
    identifications: {
      type: [identificationSchema],
      validate: {
        validator: function (value) {
          // create a set of unique combos: cardType|cardCode
          if (!value) return true;
          const seen = new Set();
          for (const id of value) {
            const key = `${id.cardType}|${id.cardCode}`;
            if (seen.has(key)) {
              return false;
            } // duplicate found
            seen.add(key);
          }
          return true;
        },
        message:
          "Duplicate identifications are not allowed (same cardType and cardCode).",
      },
    },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

userInfoSchema.pre("save", async function (next) {
  if (
    !this.isModified("identifications") ||
    this.identifications.length === 0
  ) {
    return next();
  }

  const currentDoc = this;
  const identifications = currentDoc.identifications || [];

  for (const id of identifications) {
    // 1. Check if the cardType and cardCode exist in any *other* document
    const query = {
      // Find a document where one of the identifications matches
      "identifications.cardType": id.cardType,
      "identifications.cardCode": id.cardCode,
      // Exclude the current document being saved/updated
      _id: { $ne: currentDoc._id },
    };

    // Use the model directly via mongoose.model('UserInfo')
    // since `this` inside the hook is the document instance.
    const existingUser = await mongoose.model("UserInfo").findOne(query);

    if (existingUser) {
      // Found a match in another user's document
      const error = new Error(
        `Identification (Type: ${id.cardType}, Code: ${id.cardCode}) is already registered to another user.`
      );
      // Set the error name to something identifiable for handling
      error.name = "DuplicateIdentificationError";
      return next(error);
    }
  }

  next(); // No duplicates found, proceed with save
});

// ✅ Virtual field for age
// userInfoSchema.virtual("age").get(function () {
//   if (!this.dateOfBirth) return null;

//   const today = new Date();
//   const birthDate = new Date(this.dateOfBirth);
//   let age = today.getFullYear() - birthDate.getFullYear();
//   const monthDiff = today.getMonth() - birthDate.getMonth();

//   // adjust if birthday hasn’t occurred yet this year
//   if (
//     monthDiff < 0 ||
//     (monthDiff === 0 && today.getDate() < birthDate.getDate())
//   ) {
//     age--;
//   }

//   return age;
// });

userInfoSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const diff = Date.now() - this.dateOfBirth.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
});

// userInfoSchema.set("toJSON", { virtuals: true, id: false });
// userInfoSchema.set("toObject", { virtuals: true, id: false });

userInfoSchema.plugin(mongoosePaginate);

export default mongoose.model("UserInfo", userInfoSchema);
