### Member

A whatsapp group member chatbot to assistant group members access content from conversations with AI, summarize, ask questions and highlights about the group conversation. Keeping your the whole conversation in the same group chat.

## Development

```sh
# Install dependencies
yarn install

# Start cloud functions
yarn watch:functions

# Start cloud run websocket
yarn watch:ws

# Deploy resources
# First give executable permission
chmod + ./bin/deploy.sh

# then cli
./bin/deploy.sh

```

### Google Cloud Platform

You'll need to setup a GCP project that has access to Google Cloud Run. You should create a service account that has the following roles: `Cloud Run Admin` and `Service Account User`.

You'll also need to create a private key for the service account (it should download a JSON file). You'll want to run `base64 <path/to/json>` and set it as the `GOOGLE_APPLICATION_CREDENTIALS` secret in GitHub.

Make sure to enable all resources needed on Google cloud listed below:
  - Memory Store (Redis)
  - Cloud Function
  - Cloud Run
  - Secret Manager
  - VPC Connector

In other to run redis properly you need to create a vpc connector with id `redis-vpc-connector` and add permission to IAM with `Serverless VPC Access` role

`OPENAI_KEY` should be stored in Secret Manager
make sure to check `cloudbuild.yaml` for neccessary changes of credentials
