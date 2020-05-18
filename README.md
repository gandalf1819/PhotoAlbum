# PhotoAlbum

![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen) ![Python](https://upload.wikimedia.org/wikipedia/commons/3/34/Blue_Python_3.6_Shield_Badge.svg)

PhotoAlbum is a photo album web application which allows searching using natural language through both text and voice using
Lex, ElasticSearch, and Rekognition for an intelligent search layer to query your photos for people, objects, actions, landmarks and more.

## Architecture

![PhotoAlbum](https://github.com/NikhilNar/PhotoAlbum/blob/master/architecture.png)

# Commands to package and deploy SAM templates
  sam package --template-file template.yml --s3-bucket sam-templates-niknar --output-template-file output-template.yml
  sam deploy --template-file output-template.yml --stack-name photoalbum --capabilities CAPABILITY_IAM
  sam delete-stack --stack-name photoalbum  

## Team

* [Nikhil Nar](https://github.com/NikhilNar)
* [Suraj Gaikwad](https://github.com/surajgovardhangaikwad)
* [Chinmay Wyawahare](https://github.com/gandalf1819)
