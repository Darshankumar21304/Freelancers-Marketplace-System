const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://darshanmca2024_db_user:zhwlwmY4s993ZdBB@cluster0.4fmgmto.mongodb.net/?appName=Cluster0';
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const database = client.db('test');
    const users = database.collection('users');
    
    const email = 'darshan.mca.2024@pim.ac.in';
    const newPassword = 'Password123!';
    
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    
    const result = await users.updateOne(
      { email: email },
      { $set: { password_hash: password_hash } }
    );
    
    console.log('Modified count for darshan.mca.2024@pim.ac.in:', result.modifiedCount);
    
    const email2 = 'Darshan.mca.pim@2024.ac.in';
    const result2 = await users.updateOne(
      { email: email2 },
      { $set: { password_hash: password_hash } }
    );
    console.log('Modified count for Darshan.mca.pim@2024.ac.in:', result2.modifiedCount);
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
