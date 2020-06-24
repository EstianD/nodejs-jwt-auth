import json
import boto3

def lambda_handler(event, context):
    
    # Facial rekognition client
    client=boto3.client('rekognition')
    # S3 client 
    s3 = boto3.client('s3')

    # TODO implement
    bucket = "face-watch"
    key = event['Records'][0]['s3']['object']['key']
    collection_id = key.split('/')[0]
    
    photoString=key.split('/')[1]
    photo=photoString.split('.')[0]
    
    print(key)
    print(photo)
    
    # Scan image for faces
    response=client.index_faces(CollectionId=collection_id,
                                Image={'S3Object':{'Bucket':bucket,'Name':key}},
                                ExternalImageId=photo,
                                MaxFaces=10,
                                QualityFilter="AUTO",
                                DetectionAttributes=['ALL'])
                          
    # Loop through all faces in image     
    print(response)
    print ('Results for ' + photo) 	
    print('Faces indexed:')						
    for faceRecord in response['FaceRecords']:
         print('  Face ID: ' + faceRecord['Face']['FaceId'])
         print('  Location: {}'.format(faceRecord['Face']['BoundingBox']))

    # Create JSON file of facial data response object
    facialObject = response
    # Create filename
    filenameJson = key.split('.')[0] + '.json'

    uploadByteStream = bytes(json.dumps(facialObject).encode('UTF-8'))

    # Upload file to S3
    s3.put_object(Bucket=bucket, Key=filenameJson, Body=uploadByteStream)
    
    print('JSON file created!')
    
    # Unindexed faces
    print('Faces not indexed:')
    for unindexedFace in response['UnindexedFaces']:
        print(' Location: {}'.format(unindexedFace['FaceDetail']['BoundingBox']))
        print(' Reasons:')
        for reason in unindexedFace['Reasons']:
            print('   ' + reason)
    return len(response['FaceRecords'])
    
    
