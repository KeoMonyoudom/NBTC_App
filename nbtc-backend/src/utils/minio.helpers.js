import { minioClient } from "../config/minio.js";

const mimeMap = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export const getImageStream = async (bucket, filename) => {
  const stream = await minioClient.getObject(bucket, filename);

  const ext = filename.split(".").pop().toLowerCase();
  const contentType = mimeMap[ext] || "application/octet-stream";

  return { stream, contentType };
};

export const buildPublicUrl = (bucket, filename) => {
  return `${process.env.MINIO_PUBLIC_URL}/${bucket}/${filename}`;
};

export const deleteMinioFile = async (bucket, filename) => {
  await minioClient.removeObject(bucket, filename);
};

export const getMinioStream = async (bucket, filename) => {
  const stream = await minioClient.getObject(bucket, filename);
  return stream;
};
