import crypto from "crypto";
import path from "path";

export const generateFilePathForFile = (baseFolder, originalname) => {
  const ext = path.extname(originalname);
  const unique = crypto.randomBytes(8).toString("hex");

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${baseFolder}/${year}/${month}/${unique}${ext}`;
};

export const generateFilePath = (folder, filename) => {
  const timestamp = Date.now();
  const cleanName = filename.replace(/\s+/g, "-").toLowerCase();

  return `${folder}/${timestamp}-${cleanName}`;
};
