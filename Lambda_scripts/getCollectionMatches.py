import json
import boto3

def lambda_handler(event, context):
    
    collectionId = event['queryStringParameters']['collectionId']
    # collectionId = event["collectionId"]
    profileBucket = "face-watch-profiles"
    uploadsBucket = "face-watch"
    threshold = 80
    maxFaces=5
    
    print("START")
    print(collectionId)
        
    s3 = boto3.client('s3')
    client=boto3.client('rekognition')
        
    keys = []
    matchesObject = {}
    profiles = {}

    matchesObject['profiles'] = [] 
    resp = s3.list_objects_v2(Bucket=profileBucket, Prefix=collectionId)
    for obj in resp['Contents']:
        profile = {}
        matches = []
        keys.append(obj['Key'])
        profileFilename=obj['Key']
        profileString = obj['Key'].split('/')[1]
    
        # Rekognition
        response=client.search_faces_by_image(CollectionId=collectionId,
                                    Image={'S3Object':{'Bucket':profileBucket,'Name':profileFilename}},
                                    FaceMatchThreshold=threshold,
                                    MaxFaces=maxFaces)
        
        faceMatches=response['FaceMatches']
        
        for match in faceMatches:
            matches.append(match['Face']['ExternalImageId'])
            
        profile = {
            "source": profileString,
            "matches": matches
        }
        matchesObject['profiles'].append(profile)

    return {
        'statusCode': 200,
        'body': json.dumps(matchesObject)
    }

        