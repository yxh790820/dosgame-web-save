FROM docker.1ms.run/oldiy/dosgame-web-docker:latest

WORKDIR /app

COPY app.py game_infos.py ./
COPY templates ./templates
COPY static ./static

EXPOSE 262
