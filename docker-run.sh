#!/usr/bin/env bash
docker build --tag meds:latest .
read -r uid < <(id -u)
read -r gid < <(id -g)
docker run --name meds -it --rm \
  -v ./.local:/config \
  -e HTTP_PORT=8986 \
  -p 8986:8986 \
  -u $uid:$gid \
  meds:latest
