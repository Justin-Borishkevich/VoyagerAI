const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user');
const Vehicle = require('../models/vehicle');
const expect = chai.expect;

chai.use(chaiHttp);

describe('User Registration', () => {
  beforeEach(async () => {
    await User.deleteOne({ email: 'testuser@example.com' });
  });

  it('should register a new user with valid data', (done) => {
    chai.request(app)
      .post('/users')
      .type('form')
      .send({
        firstName: 'Test',
        lastName: 'User',
        email: 'testuser@example.com',
        password: 'password123'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.redirects[0]).to.include('/users/login');
        done();
      });
  });
});

describe('User Login', () => {
  before(async () => {
    await User.deleteOne({ email: 'testuser@example.com' });
    await new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'password123'
    }).save();
  });

  it('should log in a user with correct credentials', (done) => {
    chai.request(app)
      .post('/users/login')
      .type('form')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.redirects[0]).to.include('/users/profile');
        done();
      });
  });

  it('should NOT log in with incorrect password', (done) => {
    chai.request(app)
      .post('/users/login')
      .type('form')
      .send({
        email: 'testuser@example.com',
        password: 'wrongpassword'
      })
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.redirects[0]).to.include('/users/login');
        done();
      });
  });
});

describe('Protected Route Access', () => {
  it('should block access to profile when not logged in', (done) => {
    chai.request(app)
      .get('/users/profile')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.redirects[0]).to.include('/users/login');
        done();
      });
  });
});

describe('Authenticated Access', () => {
  let agent;

  beforeEach(async () => {
    agent = chai.request.agent(app);

    await User.deleteOne({ email: 'agenttest@example.com' });
    await Vehicle.deleteMany({});

    await new User({
      firstName: 'Agent',
      lastName: 'Tester',
      email: 'agenttest@example.com',
      password: 'password123'
    }).save();

    await Vehicle.create({
      vin: 'TESTVIN123456',
      make: 'TestMake',
      model: 'TestModel',
      year: 2025,
      type: 'SUV',
      pricePerDay: 49,
      imageUrl: 'https://example.com/image.jpg',
      description: 'A test vehicle',
      seats: 5,
      mpg: '30 MPG',
      available: true,
    });

    await agent
      .post('/users/login')
      .type('form')
      .send({ email: 'agenttest@example.com', password: 'password123' });
  });

  it('should allow access to /users/profile after login', (done) => {
    agent
      .get('/users/profile')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.text).to.include('Welcome, Agent Tester');
        done();
      });
  });

  it('should allow access to /rentals after login', async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await agent.get('/rentals');

      if (res.text.includes('Your Rentals')) {
        expect(res).to.have.status(200);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    throw new Error('Rentals page did not load with expected content.');
  });

  it('should delete the logged-in user account', async () => {
    const res = await agent.delete('/users/profile/delete');
    expect(res).to.have.status(200);
    expect(res.redirects[0]).to.include('/users/login');


    const user = await User.findOne({ email: 'agenttest@example.com' });
    expect(user).to.be.null;
  });
});
