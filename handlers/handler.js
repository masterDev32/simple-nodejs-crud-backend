const { v4: uuidv4 } = require('uuid');

class Handler {
  constructor(db) {
    this.dynamoDb = db;
  }
  async getAllCounters() {
    let response;
    const params = {
      TableName: process.env.DYNAMO_TABLE,
    };
    try {
      const queryResult = await this.dynamoDb.scan(params).promise();
      response = { statusCode: 200, body: this.mapResponse(queryResult) };
    } catch (error) {
      response = { statusCode: 500 };
    }
    return response;
  }

  async createCounter({ body }) {
    let response;
    const counterObj = Object.assign({ id: uuidv4() }, body);
    const params = {
      TableName: process.env.DYNAMO_TABLE,
      Item: counterObj,
    };

    try {
      await this.dynamoDb.put(params).promise();
      response = { statusCode: 200, body: counterObj };
    } catch (error) {
      response = { statusCode: 500 };
    }
    return response;
  }

  async updateCounter({ params }) {
    let response;
    const dynamoParams = {
      TableName: process.env.DYNAMO_TABLE,
      Key: {
        id: params.counterId,
      },
      UpdateExpression: 'set count_value = count_value + :num',
      ConditionExpression: 'id = :counterId',
      ExpressionAttributeValues: {
        ':num': 1,
        ':counterId': params.counterId,
      },
      ReturnValues: 'ALL_NEW',
    };

    try {
      const queryResult = await this.dynamoDb.update(dynamoParams).promise();
      response = { statusCode: 200, body: queryResult.Attributes };
    } catch (error) {
      response = { statusCode: 404, body: 'Not found' };
    }
    return response;
  }

  async deleteCounter({ params }) {
    let response;
    const decrementCounterParams = {
      TableName: process.env.DYNAMO_TABLE,
      Key: {
        id: params.counterId,
      },
      UpdateExpression: 'set count_value = count_value - :num',
      ConditionExpression: 'id = :counterId',
      ExpressionAttributeValues: {
        ':num': 1,
        ':counterId': params.counterId,
      },
      ReturnValues: 'ALL_NEW',
    };
    const deleteRowParams = {
      TableName: process.env.DYNAMO_TABLE,
      Key: {
        id: params.counterId,
      },
    };

    try {
      let queryResult = await this.dynamoDb.update(decrementCounterParams).promise();
      if (queryResult.Attributes && queryResult.Attributes.count_value <= 0) {
        queryResult = await this.dynamoDb.delete(deleteRowParams).promise();
      }
      response = {
        statusCode: 200,
        body: queryResult.Attributes ? queryResult.Attributes : {},
      };
    } catch (error) {
      response = { statusCode: 404, body: 'Not found' };
    }
    return response;
  }

  async getSingleCounter({ params }) {
    let response;
    const getOperationParams = {
      TableName: process.env.DYNAMO_TABLE,
      Key: {
        id: params.counterId,
      },
      KeyConditionExpression: 'id = :id',
      ExpressionAttributeValues: {
        ':id': params.counterId,
      },
    };

    try {
      const queryResult = await this.dynamoDb.query(getOperationParams).promise();
      response = {
        statusCode: 200,
        body: queryResult && queryResult.Count ? queryResult.Items[0] : {},
      };
    } catch (error) {
      response = { statusCode: 404, body: 'Not found' };
    }
    return response;
  }

  mapResponse(content) {
    return content.Count ? content.Items : [];
  }
}

module.exports = {
  Handler,
};
