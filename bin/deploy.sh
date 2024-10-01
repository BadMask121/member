#!/bin/bash

env_path=".env.prod"
APP_NAME="member-app"
PROJECT_ID="member-121"
INSTANCE_NAME="member-app-2"
ZONE="us-central1-b"

# Check if .env file exists
if [ ! -f $env_path ]; then
    echo "Error: $env_path file not found"
    exit 1
fi

# Read env_path file and export variables
set -a
source $env_path
set +a

# Prepare substitutions string for gcloud command
substitutions=""
while IFS='=' read -r key value || [[ -n "$key" ]]; do
    # Skip comments and empty lines
    [[ $key =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    
    # Escape special characters in the value
    escaped_value=$(printf '%s\n' "$value" | sed -e 's/[\/&]/\\&/g')
    
    # Append to substitutions string
    substitutions="${substitutions},${key}=${escaped_value}"
done < $env_path

# Remove leading comma
substitutions=${substitutions#,}

docker build -t gcr.io/$PROJECT_ID/$APP_NAME:latest .

docker push gcr.io/$PROJECT_ID/$APP_NAME:latest

# # Check if the instance exists
if gcloud compute instances describe $INSTANCE_NAME --project $PROJECT_ID --zone $ZONE &> /dev/null; then
    echo "Instance $INSTANCE_NAME exists. Restarting..."
    gcloud compute instances stop $INSTANCE_NAME --project $PROJECT_ID --zone $ZONE
    gcloud compute instances start $INSTANCE_NAME --project $PROJECT_ID --zone $ZONE
else
    echo "Instance $INSTANCE_NAME does not exist. Creating..."
    gcloud compute instances create-with-container $INSTANCE_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=e2-medium \
    --network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=42154531239-compute@developer.gserviceaccount.com \
    --scopes=https://www.googleapis.com/auth/cloud-platform \
    --tags=http-server,https-server \
    --image=projects/cos-cloud/global/images/cos-stable-113-18244-151-80 \
    --boot-disk-size=50GB \
    --boot-disk-type=pd-balanced \
    --boot-disk-device-name=member-app \
    --container-image=gcr.io/$PROJECT_ID/$APP_NAME \
    --container-restart-policy=always \
    --container-privileged \
    --container-env=$substitutions \
    --container-mount-host-path=host-path=/home/jeffreyefemena4/member/.wwebjs_auth,mode=rw,mount-path=/usr/src/app/dist/.wwebjs_auth \
    --container-mount-host-path=host-path=/home/jeffreyefemena4/member/.wwebjs_cache,mode=ro,mount-path=/usr/src/app/dist/.wwebjs_cache \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --labels=goog-ec-src=vm_add-gcloud,container-vm=cos-stable-113-18244-151-80
fi

# gcloud builds submit --config cloudbuild.yaml --substitutions=$substitutions

# gcloud functions deploy summarize \
#   --runtime nodejs18 \
#   --memory 1Gb \
#   --gen2 \
#   --region us-central1 \
#   --trigger-topic summarize_chat \
#   --entry-point summarize \
#   --set-env-vars="ENV=${ENV},MESSAGE_CRYPTO_KEY=${MESSAGE_CRYPTO_KEY},OPENAI_API_KEY=${OPENAI_API_KEY},SMTP_EMAIL=${SMTP_EMAIL},SMTP_HOST=${SMTP_HOST},SMTP_PASSWORD=${SMTP_PASSWORD}"
# # Print the gcloud command
# echo "Run the following command to submit your build:"
# echo "gcloud builds submit --config cloudbuild.yaml --substitutions=\"$substitutions\""

# # Export the substitutions variable for easy use
# export CLOUDBUILD_SUBSTITUTIONS="$substitutions"
# echo "The substitutions have been exported as CLOUDBUILD_SUBSTITUTIONS"
# echo "You can use it like this:"
# echo "gcloud builds submit --config cloudbuild.yaml --substitutions=\"\$CLOUDBUILD_SUBSTITUTIONS\""
