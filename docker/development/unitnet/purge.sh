#!/usr/bin/env sh

docker stop ark-unitnet-postgres
docker rm -v ark-unitnet-postgres
docker volume rm unitnet_postgres
docker network rm unitnet_default
