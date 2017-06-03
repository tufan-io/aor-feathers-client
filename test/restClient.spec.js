"use strict";

const expect = require('chai').expect;
const sinon = require('sinon');
const restClient = require('../lib').restClient;
const types = require('admin-on-rest/lib/rest/types');

const findResult = {
  total: 1,
  data: [
    { id: 1 },
  ]
};
const getResult = { id: 1, title: 'gotten' };
const updateResult = { id: 1, title: 'updated' };
const createResult = { id: 1, title: 'created' };
const removeResult = { id: 1, title: 'deleted' };

let aorClient, fakeClient, fakeService;

function setupClient(options) {
  fakeService = {
    find: sinon.stub().returns(Promise.resolve(findResult)),
    get: sinon.stub().returns(Promise.resolve(getResult)),
    update: sinon.stub().returns(Promise.resolve(updateResult)),
    create: sinon.stub().returns(Promise.resolve(createResult)),
    remove: sinon.stub().returns(Promise.resolve(removeResult)),
  };

  fakeClient = {
    service: (resource) => fakeService,
  };

  aorClient = restClient(fakeClient, options);
}


function testWithOptions(options) {
  describe('Rest Client', function () {
    let asyncResult;
    describe('when called with GET_MANY', function () {
      let ids = [1, 2, 3];
      beforeEach(function () {
        setupClient(options);
        asyncResult = aorClient(types.GET_MANY, 'posts', { ids });
      });

      it("calls the client's find method", function () {
        return asyncResult.then(result => {
          expect(fakeService.find.calledOnce).to.be.true;
        });
      });

      it('returns the data returned by the client', function () {
        return asyncResult.then(result => {
          expect(result).to.deep.equal(findResult);
        });
      });

      it("converts ids in it's params into a query and pass it to client", function () {
        let query;
        query = {'$limit': ids.length};
        query[options.id] = { '$in': ids};
        return asyncResult.then(result => {
          expect(fakeService.find.calledWith({
            query,
          })).to.be.true;
        });
      });
    });

    describe('when called with GET_LIST', function () {
      let params = {
        pagination: {
          page: 10,
          perPage: 20,
        },
        sort: {
          field: options.id,
          order: 'DESC'
        },
        filter: {
          name: 'john'
        }
      };
      beforeEach(function () {
        setupClient(options);
        asyncResult = aorClient(types.GET_LIST, 'posts', params);
      });

      it("calls the client's find method", function () {
        return asyncResult.then(result => {
          expect(fakeService.find.calledOnce).to.be.true;
        });
      });

      it('returns the data returned by the client', function () {
        return asyncResult.then(result => {
          expect(result).to.deep.equal(findResult);
        });
      });

      it('formats params into a query and pass it to client', function () {
        let query = {
          $limit: 20,
          $skip: 20 * 9,
          name: 'john'
        };
        let sort = '$sort[' + options.id +']';
        query[sort] = '-1';
        return asyncResult.then(result => {
          expect(fakeService.find.calledWith({
            query,
          })).to.be.true;
        });
      });
    });

    describe('when called with GET_ONE', function () {
      let params = {};
      params[options.id] = 1;
      beforeEach(function () {
        setupClient(options);
        asyncResult = aorClient(types.GET_ONE, 'posts', params);
      });

      it("calls the client's get method with the id in params", function () {
        return asyncResult.then(result => {
          expect(fakeService.get.calledOnce).to.be.true;
          expect(fakeService.get.calledWith(1));
        });
      });

      it('returns the data returned by the client in a "data" object', function () {
        return asyncResult.then(result => {
          expect(result).to.deep.equal({ data: getResult });
        });
      });
    });

    describe('when called with UPDATE', function () {
      let params = {
        data: {
          title: 'updated'
        }
      };
      params[options.id] = 1;
      beforeEach(function () {
        setupClient(options);
        asyncResult = aorClient(types.UPDATE, 'posts', params);
      });

      it("calls the client's update method with the id and data in params", function () {
        return asyncResult.then(result => {
          expect(fakeService.update.calledOnce).to.be.true;
          expect(fakeService.update.calledWith(1, { title: 'updated' }));
        });
      });

      it('returns the data returned by the client in a "data" object', function () {
        return asyncResult.then(result => {
          expect(result).to.deep.equal({ data: updateResult });
        });
      });
    });

    describe('when called with CREATE', function () {
      let params = {
        data: {
          title: 'created'
        }
      };
      beforeEach(function () {
        setupClient(options);
        asyncResult = aorClient(types.CREATE, 'posts', params);
      });

      it("calls the client's create method with the data in params", function () {
        return asyncResult.then(result => {
          expect(fakeService.create.calledOnce).to.be.true;
          expect(fakeService.create.calledWith({ title: 'created' }));
        });
      });

      it('returns the data returned by the client in a "data" object', function () {
        return asyncResult.then(result => {
          expect(result).to.deep.equal({ data: createResult });
        });
      });
    });

    describe('when called with DELETE', function () {
      let params = {};
      params[options.id] = 1;
      beforeEach(function () {
        setupClient(options);
        asyncResult = aorClient(types.DELETE, 'posts', params);
      });

      it("calls the client's remove method with the id in params", function () {
        return asyncResult.then(result => {
          expect(fakeService.remove.calledOnce).to.be.true;
          expect(fakeService.remove.calledWith(1));
        });
      });

      it('returns the data returned by the client', function () {
        return asyncResult.then(result => {
          expect(result).to.deep.equal({ data: removeResult });
        });
      });
    });

    describe('when called with an invalid type', function () {
      beforeEach(function () {
        setupClient(options);
      });

      it('should throw an error', function () {
        const errorRes = new Error('Unsupported FeathersJS restClient action type WRONG_TYPE')
        try {
          return aorClient('WRONG_TYPE', 'posts', {})
            .then(result => {
              throw new Error("client must reject");
            });
        } catch (err) {
          expect(err).to.deep.equal(errorRes);
        }
      });
    });
  });
}

const options = [
  { id: 'id' },
  { id: '_id' }
];

options.forEach(option => testWithOptions(option));
