const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/user');
const Vehicle = require('../models/vehicle');
const RentalSession = require('../models/rentalSession');
const expect = chai.expect;

chai.use(chaiHttp);

// 🧠 Utility to find non-overlapping future date range
function getNonOverlappingDateRange(existingSessions, days = 3) {
  const today = new Date();
  let start = new Date(today.setDate(today.getDate() + 3)); // start 3 days from now
  let end = new Date(start);
  end.setDate(end.getDate() + days);

  let safe = false;

  while (!safe) {
    safe = existingSessions.every(session => {
      const sessionStart = new Date(session.startDate);
      const sessionEnd = new Date(session.endDate);

      return end < sessionStart || start > sessionEnd; // no overlap
    });

    if (!safe) {
      start.setDate(start.getDate() + days + 1);
      end = new Date(start);
      end.setDate(end.getDate() + days);
    }
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0]
  };
}

describe('Rental Session Booking', function () {
  this.timeout(5000); // increase timeout in case db is slow

  const agent = chai.request.agent(app);
  let vehicle;
  let user;
  let startDate, endDate;

  before(async () => {
    // Cleanup only test-created user and vehicle
    await Vehicle.deleteMany({ make: 'Test', model: 'Car' });
    await User.deleteOne({ email: 'rentaluser@example.com' });

    // Register user via app route
    await agent
      .post('/users')
      .type('form')
      .send({
        firstName: 'Rental',
        lastName: 'User',
        email: 'rentaluser@example.com',
        password: 'password123'
      });

    // Log in to get session
    const loginRes = await agent
      .post('/users/login')
      .type('form')
      .send({
        email: 'rentaluser@example.com',
        password: 'password123'
      });

    expect(loginRes).to.have.status(200);

    // Get user
    user = await User.findOne({ email: 'rentaluser@example.com' });

    // Create vehicle
    vehicle = await new Vehicle({
      vin: 'VIN-RENTAL-123',
      make: 'Test',
      model: 'Car',
      year: 2024,
      type: 'Sedan',
      pricePerDay: 50,
      seats: 5,
      mpg: '33 MPG',
      available: true,
      imageUrl: '/images/test-car.jpg'
    }).save();

    // 🧠 Find safe date range
    const existingSessions = await RentalSession.find({ vehicle: vehicle._id });
    const safeRange = getNonOverlappingDateRange(existingSessions);

    startDate = safeRange.startDate;
    endDate = safeRange.endDate;
  });

 it('should successfully book a rental session', async () => {
    const res = await agent
        .post('/rentals/confirm')
        .type('form')
        .send({
        vehicleId: vehicle._id.toString(),
        startDate,
        endDate,
        cardNum: '4111111111111111',
        exp: '2025-12',
        cvc: '123'
        });

    expect(res).to.have.status(200);
    expect(res.redirects[0]).to.include('/rentals');

    const session = await RentalSession.findOne({
        user: user._id,
        vehicle: vehicle._id,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
    });

    expect(session).to.exist;
    expect(session.status).to.equal('active');

    // ✅ CLEANUP: delete the test session right away
    await RentalSession.deleteOne({ _id: session._id });
    });
});
