import json

import boto3
import requests

ES_HOST = 'https://vpc-photosearch-n3iu72etjtdnclayan6fq44twe.us-east-1.es.amazonaws.com'
REGION = 'us-east-1'


def get_url(es_index, es_type):
    url = ES_HOST + '/' + es_index + '/' + es_type + '/_search'
    return url


def get_slots_from_lex(query):
    lex = boto3.client('lex-runtime')

    # AWS Lex
    print("query:{}".format(query))
    lex_response = lex.post_text(
        botName='AlbumBot',
        botAlias='albumbot',
        inputText=query,
        userId='12345'
    )
    print("Lex response: {}".format(json.dumps(lex_response)))
    if "slots" in lex_response.keys():
        slots = lex_response['slots'], True
    else:
        slots = {}, False
    return slots


def get_image_list(slots):
    headers = {"Content-Type": "application/json"}
    img_list = []
    for i, tag in slots.items():
        if tag:
            url = get_url('photoalbum', 'photos')
            print("ES URL --- {}".format(url))
            query = {
                "size": 25,
                "query": {
                    "multi_match": {
                        "query": tag,
                    }
                }
            }
            es_response = requests.get(url, headers=headers,
                                       data=json.dumps(query)).json()
            print("ES RESPONSE --- {}".format(json.dumps(es_response)))

            es_src = es_response['hits']['hits']
            print("ES HITS --- {}".format(json.dumps(es_src)))
            object_keys = set()
            for photo in es_src:
                labels = [word.lower() for word in photo['_source']['labels']]
                if tag in labels:
                    object_key = photo['_source']['objectKey']
                    if object_key not in object_keys:
                        object_keys.add(object_key)
                        img_url = 'https://photoalbum-b2-1tofw05nrs04i.s3.amazonaws.com/' + object_key
                        img_list.append(img_url)
    return img_list


def build_response(code, body):
    return {
        'statusCode': code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        'body': json.dumps(body)
    }


def lambda_handler(event, context):
    # recieve from API Gateway
    print("EVENT --- {}".format(json.dumps(event)))
    query_params = event["queryStringParameters"]
    if not query_params:
        return build_response(400, "Bad request, there was nothing in the query params")
    query = query_params["q"]
    print("QueryStringParameters: ----", query)

    # AWS Transcribe: Get transcribed text from voice recordings
    if (query == "transcriptionStart"):
        transcribe = boto3.client('transcribe')
        job_name = time.strftime("%a %b %d %H:%M:%S %Y", time.localtime()).replace(":",
                                                                                   "-").replace(
            " ", "")
        job_uri = "https://s3.amazonaws.com/transcribe-notes/test.wav"
        transcribe.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': job_uri},
            MediaFormat='wav',
            LanguageCode='en-US'
        )
        while True:
            status = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            if status['TranscriptionJob']['TranscriptionJobStatus'] in ['COMPLETED',
                                                                        'FAILED']:
                break
            print("Transcription not ready yet!")
            time.sleep(5)
        print("Transcript URL: ", status)
        transcriptURL = status['TranscriptionJob']['Transcript']['TranscriptFileUri']
        trans_text = requests.get(transcriptURL).json()

        print("Transcripts: ", trans_text)
        print(trans_text["results"]['transcripts'][0]['transcript'])

        s3client = boto3.client('s3')
        response = s3client.delete_object(
            Bucket='transcribe-notes',
            Key='test.wav'
        )
        query = trans_text["results"]['transcripts'][0]['transcript']
        s3client.put_object(Body=query, Bucket='transcribe-notes', Key='test.wav')
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': "Transcription completed"
        }

    if (query == "transcriptionEnd"):
        s3client = boto3.client('s3')
        data = s3client.get_object(Bucket='transcribe-notes', Key='test.wav')
        query = data.get('Body').read().decode('utf-8')
        print("Voice query: ", query)
        s3client.delete_object(
            Bucket='transcribe-notes',
            Key='test.wav'
        )

    slots, valid = get_slots_from_lex(query)
    if not valid:
        build_response(200, "I could not understand what you want")
    img_list = get_image_list(slots)
    print("img_list:{}".format(img_list))
    if img_list:
        return build_response(200, img_list)
    else:
        return build_response(200,
                              "There were no photos matching the categories you were looking for.")
