const { uploadToCloudinary } = require('../src/config/cloudinary');

async function testPdfUpload() {
  try {
    const fakePdfBuffer = Buffer.from('%PDF-1.4 Fake test PDF content');
    const result = await uploadToCloudinary(fakePdfBuffer, {
      folder: 'gigsphere/documents',
      resource_type: 'auto'
    });
    console.log('PDF upload success:', result.secure_url);
  } catch (err) {
    console.error('PDF upload failed:', err);
  }
}

testPdfUpload();
