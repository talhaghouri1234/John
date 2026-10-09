import supertest from 'supertest';

// Existing integration tests act as the trusted local frontend. Security tests
// use raw supertest so missing and hostile headers are never supplied for them.
const request = (app) => supertest.agent(app).set({
  Origin: 'http://localhost:5173',
  'X-CSRF-Protection': '1',
});
request.agent = request;
export default request;
