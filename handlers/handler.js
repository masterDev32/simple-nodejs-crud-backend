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
      const result = await this.dynamoDb.scan(params).promise();
      response = { statusCode: 200, body: this.mapResponse(result) };
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
      const result = await this.dynamoDb.update(dynamoParams).promise();
      response = { statusCode: 200, body: result.Attributes };
    } catch (error) {
      response = { statusCode: 404, body: 'Not found' };
    }
    return response;
  }

  async deleteCounter({ params }) {
    let response;
    const dynamoParams = {
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
    const dynamoDeleteParams = {
      TableName: process.env.DYNAMO_TABLE,
      Key: {
        id: params.counterId,
      },
    };

    try {
      let result = await this.dynamoDb.update(dynamoParams).promise();
      if (result.Attributes && result.Attributes.count_value <= 0) {
        result = await this.dynamoDb.delete(dynamoDeleteParams).promise();
      }
      response = {
        statusCode: 200,
        body: result.Attributes ? result.Attributes : {},
      };
    } catch (error) {
      response = { statusCode: 404, body: 'Not found' };
    }
    return response;
  }

  async getSingleCounter({ params }) {
    let response;
    const dynamoParams = {
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
      const result = await this.dynamoDb.query(dynamoParams).promise();
      response = {
        statusCode: 200,
        body: result && result.Count ? result.Items[0] : {},
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
