// utils/minioUrl.js
export const getPublicMinioUrl = (bucket, filename) => {
  return `${process.env.MINIO_PUBLIC_URL}/${bucket}/${filename}`;
};
