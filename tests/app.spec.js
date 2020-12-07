'use strict';
const proxyquire = require('proxyquire');
const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;

class DocumentClient {
  constructor() {}
  scan() {
    return {
      promise: () => ({
        Count: 2,
        Items: [
          { id: '123456789', count_value: 1 },
          { id: '123456789', count_value: 10 },
        ],
      }),
    };
  }

  put() {
    return {
      promise: () => {},
    };
  }

  delete() {
    return {
      promise: () => ({
        Attributes: { id: '123456789', count_value: 1 },
      }),
    };
  }

  update() {
    return {
      promise: () => ({
        Attributes: { id: '123456789', count_value: 2 },
      }),
    };
  }

  query() {
    return {
      promise: () => ({
        Count: 1,
        Items: [{ id: '123456789', count_value: 1 }],
      }),
    };
  }
}
const AWS = {
  DynamoDB: {
    DocumentClient,
  },
};
const app = proxyquire('../app.js', {
  'aws-sdk': AWS,
});
// Configure chai
chai.use(chaiHttp);
chai.should();

describe('Tests app.js', function () {
  describe('GET /counters', () => {
    it('should get all counters', (done) => {
      chai
        .request(app)
        .get('/counters')
        .end((err, res) => {
          const { body } = res.body;
          res.should.have.status(200);
          res.body.should.be.a('object');
          expect(body.length).equal(2);
          done();
        });
    });
  });

  describe('POST /counters', () => {
    it('should post a new counter', (done) => {
      const content = {
        count_value: 2,
        counter_name: 'NAME',
      };
      chai
        .request(app)
        .post('/counters')
        .set('content-type', 'application/json')
        .send(content)
        .end((err, res) => {
          const { body } = res.body;
          res.should.have.status(200);
          res.body.should.be.a('object');
          expect(body).haveOwnProperty('count_value');
          expect(body).haveOwnProperty('counter_name');
          expect(body).haveOwnProperty('id');
          done();
        });
    });
  });

  describe('PUT /counters/:id', () => {
    it('should update a counter', (done) => {
      chai
        .request(app)
        .put(`/counters/${123456}`)
        .set('content-type', 'application/json')
        .end((err, res) => {
          const { body } = res.body;
          res.should.have.status(200);
          res.body.should.be.a('object');
          expect(body).deep.equal({ id: '123456789', count_value: 2 });
          done();
        });
    });
  });

  describe('DELETE /counters/:id', () => {
    it('should delete a counter', (done) => {
      chai
        .request(app)
        .delete(`/counters/${123456}`)
        .set('content-type', 'application/json')
        .end((err, res) => {
          const { body } = res.body;
          res.should.have.status(200);
          res.body.should.be.a('object');
          expect(body).deep.equal({ id: '123456789', count_value: 2 });
          done();
        });
    });
  });

  describe('GET /counters/:id', () => {
    it('should delete a counter', (done) => {
      chai
        .request(app)
        .get(`/counters/${123456}`)
        .set('content-type', 'application/json')
        .end((err, res) => {
          const { body } = res.body;
          res.should.have.status(200);
          res.body.should.be.a('object');
          expect(body).deep.equal({ id: '123456789', count_value: 1 });
          done();
        });
    });
  });
});
