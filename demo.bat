@echo off
cd /d F:\quiz-battle
docker compose up -d
F:\cloudflared\cloudflared.exe tunnel --protocol http2 --url http://localhost:80
