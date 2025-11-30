import multer from "multer";
import { MinioStorageEngine } from "@namatery/multer-minio";
import { minioClient } from "../config/minio.js";
import { generateFilePath } from "../utils/generate.file.path.js";

export const createMinioUploader = (folder) => {
  return multer({
    storage: new MinioStorageEngine({
      client: minioClient,
      region: "us-east-1",
      bucket: {
        name: process.env.MINIO_BUCKET || "nbtc-files",
        init: true,
      },
      allowedContentTypes: [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ],
      metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
      object: (req, file, cb) => {
        const filePath = generateFilePath(folder, file.originalname);
        cb(null, {
          bucket: process.env.MINIO_BUCKET || "nbtc-files",
          key: filePath,
          metadata: {
            originalname: file.originalname,
            mimetype: file.mimetype,
          },
        });
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB limit
    },
  });
};
