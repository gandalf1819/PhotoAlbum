import json

import boto3
import requests

ES_HOST = 'https://vpc-photosearch-n3iu72etjtdnclayan6fq44twe.us-east-1.es.amazonaws.com'
REGION = 'us-east-1'


def get_url(es_index, es_type):
    url = ES_HOST + '/' + es_index + '/' + es_type + '/_search'
    return url


def get_slots_from_lex(event):
    lex = boto3.client('lex-runtime')
    query = event["queryStringParameters"]["q"]
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
            "Access-Control-Allow-Origin": "*",
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body)
    }


def lambda_handler(event, context):
    # recieve from API Gateway
    print("EVENT --- {}".format(json.dumps(event)))
    slots, valid = get_slots_from_lex(event)
    if not valid:
        build_response(200, "I could not understand what you want")
    img_list = get_image_list(slots)
    print("img_list:{}".format(img_list))
    if img_list:
        return build_response(200, img_list)
    else:
        return build_response(200,
                       "There were no photos matching the categories you were looking for.")
