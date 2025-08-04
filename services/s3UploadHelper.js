const { S3Client, PutObjectCommand, url } = require("@aws-sdk/client-s3");
const { generateUniqueFileName } = require("../utils/helper");

const region = process.env.AWS_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const accountId = process.env.AWS_ACCOUNT_ID;
const bucketName = process.env.AWS_BUCKET_NAME;
const s3Client = new S3Client({
  region: region,
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
    accountId: accountId,
  },
});

const uploadFileToS3 = async (fileName, fileBuffer, fileType) => {
  try {
    const newfileName = generateUniqueFileName(fileName);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: newfileName,
      Body: fileBuffer,
      ContentType: fileType,
      ContentDisposition: "attachment",
    });

    const uploadResult = await s3Client.send(command);

    if (uploadResult) {
      return newfileName;
    }
    return false;
  } catch (error) {
    console.log("Failed to upload file in s3", error);

    return false;
  }
};

module.exports = {
  uploadFileToS3,
};
