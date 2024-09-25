#!/bin/sh

firebase deploy --only firestore:indexes

gcloud builds submit --config cloudbuild.yaml


gcloud functions deploy helloPubSub \
  --runtime nodejs16 \
  --memory 1Gb \
  --trigger-topic INIT_CHAT \
  --entry-point helloPubSub