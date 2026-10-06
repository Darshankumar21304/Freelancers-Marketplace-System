const mongoose = require('mongoose');
require('dotenv').config();

async function inspectClientData() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gigsphere';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const { User, Project, Contract, Transaction } = require('../src/models');

  const users = await User.find({ role: 'client' }).lean();
  console.log('\n--- CLIENT USERS ---');
  users.forEach(u => {
    console.log(`ID: ${u._id}, Name: ${u.name}, Company: ${u.companyName}, Email: ${u.email}, Wallet: ${u.walletBalance}, Escrow: ${u.escrowBalance}`);
  });

  const projects = await Project.find().lean();
  console.log('\n--- PROJECTS ---');
  projects.forEach(p => {
    console.log(`ID: ${p._id}, Title: ${p.title}, Status: ${p.status}, ClientID: ${p.client_id}, Budget: ${p.budget}, Proposals: ${p.proposals?.length}`);
    if (p.proposals?.length) {
      p.proposals.forEach(pr => console.log(`   -> Prop FL: ${pr.freelancer_id}, Status: ${pr.status}, Bid: ${pr.bidAmount}`));
    }
  });

  const contracts = await Contract.find().lean();
  console.log('\n--- CONTRACTS ---');
  contracts.forEach(c => {
    console.log(`ID: ${c._id}, Title: ${c.title}, Status: ${c.status}, ClientID: ${c.client_id}, FLID: ${c.freelancer_id}, TotalVal: ${c.totalValue}`);
    if (c.milestones?.length) {
      c.milestones.forEach(m => console.log(`   -> Milestone: ${m.title}, Amount: ${m.amount}, Status: ${m.status}`));
    }
  });

  const transactions = await Transaction.find().lean();
  console.log('\n--- TRANSACTIONS ---');
  transactions.forEach(t => {
    console.log(`ID: ${t._id}, UserID: ${t.user_id}, Type: ${t.type}, Amount: ${t.amount}, Status: ${t.status}, Title: ${t.title}`);
  });

  await mongoose.disconnect();
}

inspectClientData().catch(console.error);
