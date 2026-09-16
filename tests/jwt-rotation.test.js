const jwt = require('jsonwebtoken');
const { signJwt, verifyJwt } = require('../src/lib/jwt-rotation');

describe('JWT rotation compatibility', () => {
  const current = 'current-' + 'a'.repeat(64);
  const previous = 'previous-' + 'b'.repeat(64);

  beforeEach(() => {
    process.env.JWT_SECRET = current;
    process.env.JWT_SECRET_PREVIOUS = previous;
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_SECRET_PREVIOUS;
  });

  test('new tokens are signed with the current key', () => {
    const token = signJwt({ id: 1 }, { expiresIn: '1h' });
    expect(jwt.verify(token, current).id).toBe(1);
    expect(() => jwt.verify(token, previous)).toThrow();
  });

  test('tokens signed with the previous key remain valid during rotation', () => {
    const token = jwt.sign({ id: 2 }, previous, { expiresIn: '1h' });
    expect(verifyJwt(token).id).toBe(2);
  });

  test('previous-key tokens stop validating when the compatibility key is removed', () => {
    const token = jwt.sign({ id: 3 }, previous, { expiresIn: '1h' });
    delete process.env.JWT_SECRET_PREVIOUS;
    expect(() => verifyJwt(token)).toThrow();
  });

  test('expired current-key tokens stay expired and do not fall back', () => {
    const token = jwt.sign({ id: 4 }, current, { expiresIn: -1 });
    expect(() => verifyJwt(token)).toThrow(expect.objectContaining({ name: 'TokenExpiredError' }));
  });

  test('malformed tokens remain invalid', () => {
    expect(() => verifyJwt('not-a-jwt')).toThrow();
  });

  test('JWT_SECRET is mandatory', () => {
    delete process.env.JWT_SECRET;
    expect(() => signJwt({ id: 5 }, { expiresIn: '1h' })).toThrow('JWT_SECRET environment variable is required');
  });
});
