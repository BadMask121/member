### Documentation not up to date

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