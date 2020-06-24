import json
import boto3

def lambda_handler(event, context):
    
    client=boto3.client('rekognition')

    collectionId = event['queryStringParameters']['collectionId']
    
    response=client.create_collection(CollectionId=collectionId)
    
    print('collectionId: ' + collectionId)
    
    if response:
        collectionResponse = {}
        collectionResponse['status'] = 'Collection created!'
        # HTTP Response object
        responseObj = {}
        responseObj['statusCode'] = 200
        responseObj['body'] = json.dumps(collectionResponse)
    
        return responseObj
            

    collectionResponse = {}
    collectionResponse['status'] = 'Collection could not be created'
    # HTTP Response object
    responseObj = {}
    responseObj['statusCode'] = 500
    responseObj['body'] = json.dumps(collectionResponse)
    
    return responseObj
    
