
FROM alpine:latest

RUN apk add --no-cache sqlite

WORKDIR /data

EXPOSE 3306

CMD ["sqlite3", "/data/workflow.db"]

