import json
import boto3
import time
import requests

esUrl = "https://vpc-photosearch-n3iu72etjtdnclayan6fq44twe.us-east-1.es.amazonaws.com/photoalbum/photos"


def lambda_handler(event, context):
    jsonBody = event['Records'][0]
    bucketName = jsonBody['s3']['bucket']['name']
    key = jsonBody['s3']['object']['key']
    reko = boto3.client('rekognition')
    try:
        data = {}
        response = reko.detect_labels(
            Image={'S3Object': {'Bucket': bucketName, 'Name': key}})
        data['objectKey'] = key
        data['bucket'] = bucketName
        data['createdTimestamp'] = time.time()
        data['labels'] = []
        for label in response['Labels']:
            if label['Confidence'] > 95:
                data['labels'].append(label['Name'])
        body = json.dumps(data)
        headers = {"Content-Type": "application/json"}
        r = requests.post(url=esUrl, data=body, headers=headers)
    except Exception as e:
        print("Error " + str(e))

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
