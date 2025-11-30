import multer from "multer";

import { Client } from "minio";
import { MinioStorageEngine } from "@namatery/multer-minio";

export const minioClient = new Client({
  port: 9000,
  endPoint: "nbtc-file-server",
  accessKey: process.env.MINIO_ROOT_USER,
  secretKey: process.env.MINIO_ROOT_PASSWORD,
  useSSL: false,
});

const options = {
  region: "us-east-1",
  bucket: {
    init: true,
    versioning: false,
    forceDelete: false,
  },
  object: {
    name: (req, file) => {
      return `${Date.now()}-${file.originalname}`;
    },
    useOriginalFilename: false,
  },
};

const storage = new MinioStorageEngine(minioClient, "nbtc-files", options);

const createSingleUpload = (fieldName) =>
  multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  }).single(fieldName);

export const upload = createSingleUpload("file");

export const uploads = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
}).array("files", 10);

export const uploadSingle = (fieldName = "file") => createSingleUpload(fieldName);
