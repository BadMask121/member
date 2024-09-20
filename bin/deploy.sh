#!/bin/sh

firebase deploy --only firestore:indexes

gcloud builds submit --config cloudbuild.yaml
