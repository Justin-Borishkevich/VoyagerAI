const chai = require('chai');
const expect = chai.expect;

// Your functions here...
function getDaysCount(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = endDate - startDate;
  if (diffTime < 0) return 0;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function formatCardNumber(input) {
  let value = input.replace(/\D/g, '');
  return value.match(/.{1,4}/g)?.join(' ') || '';
}

// Mocha Tests
describe('Payment Script Utility Functions', () => {
  describe('getDaysCount()', () => {
    it('returns 1 when start and end dates are the same', () => {
      expect(getDaysCount('2025-08-01', '2025-08-01')).to.equal(1);
    });

    it('returns correct number of days inclusive', () => {
      expect(getDaysCount('2025-08-01', '2025-08-05')).to.equal(5);
    });

    it('returns 0 if end date is before start date', () => {
      expect(getDaysCount('2025-08-05', '2025-08-01')).to.equal(0);
    });
  });

  describe('formatCardNumber()', () => {
    it('formats a plain digit string correctly', () => {
      expect(formatCardNumber('1234123412341234')).to.equal('1234 1234 1234 1234');
    });

    it('removes non-digits and formats correctly', () => {
      expect(formatCardNumber('1234-1234-1234-1234')).to.equal('1234 1234 1234 1234');
    });

    it('returns empty string for empty input', () => {
      expect(formatCardNumber('')).to.equal('');
    });
  });
});
