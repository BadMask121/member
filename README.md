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



## TODO

[x] Implement inviting bot to group logic \
[x] Implement storing of messages to db and vector db for initializer \
[x] Implement storing of messages to db and vector db for new messages \
[x] Implement message command handlers \
[x] Implement message parser for AI commands \
[ ] Implement proper error logger with sentry \
[ ] Implement authentication and session refresh \
[ ] Implement Guardrails to replace sensitive/profane information in message before storing to db \
[ ] Implement Guardrails to prevent profane questions from being asked \
[ ] Implement queue and dlq for failed requests \