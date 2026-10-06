const mongoose = require('mongoose');
const http = require('http');

async function testProxy() {
  try {
    await mongoose.connect('mongodb://localhost:27017/gigsphere');
    console.log('Connected to MongoDB');

    const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
    const project = await Project.findOne({ 'attachments.0': { $exists: true } });

    if (!project) {
      console.log('No project with attachments found');
      process.exit(0);
    }

    const attachments = project.get('attachments');
    console.log('Found attachments:', attachments);

    const firstAttachment = attachments[0];
    const url = typeof firstAttachment === 'string' ? firstAttachment : firstAttachment.url;
    console.log('Testing PDF URL:', url);

    const proxyUrl = `http://localhost:5001/api/upload/view-pdf?url=${encodeURIComponent(url)}`;
    console.log('Requesting proxy URL:', proxyUrl);

    http.get(proxyUrl, (res) => {
      console.log('Proxy Response Status:', res.statusCode);
      console.log('Proxy Response Headers:', res.headers);
      
      let dataLen = 0;
      res.on('data', (chunk) => {
        dataLen += chunk.length;
      });
      
      res.on('end', () => {
        console.log(`Received ${dataLen} bytes from proxy`);
        process.exit(0);
      });
    }).on('error', (err) => {
      console.error('Request error:', err);
      process.exit(1);
    });

  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testProxy();
