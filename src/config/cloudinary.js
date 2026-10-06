const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 's5moukpf',
  api_key: process.env.CLOUDINARY_API_KEY || '424452388636344',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'EZAAdTgHpnvv7qIWEhhpJUs8jp4'
});

/**
  Upload a file buffer directly to Cloudinary
  @param {Buffer} buffer - File buffer from Multer
  @param {Object} options - Folder, resource_type, public_id, transformation
  @returns {Promise<Object>} Cloudinary upload result object
 */
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
      folder: options.folder || 'gigsphere/uploads',
      resource_type: options.resource_type || 'auto'
    };

    if (options.public_id) {
      defaultOptions.public_id = options.public_id;
    }

    if (options.format) {
      defaultOptions.format = options.format;
    }

    if (options.transformation) {
      defaultOptions.transformation = options.transformation;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      defaultOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload stream error:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};
