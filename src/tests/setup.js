const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');

dotenv.config();


process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_jwt_which_needs_to_be_long_enough';

let mongoServer;

beforeAll(async () => {
  
  await mongoose.disconnect();
  
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }

  
  try {
    const emailService = require('./../../src/services/email.service');
    if (emailService._transporter) {
      emailService._transporter.close();
    }
  } catch (_) {  }
});

