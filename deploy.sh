#!/usr/bin/env bash

REMOTE_HOST="ec2-3-214-232-108.compute-1.amazonaws.com"
DOCKER_HOST="tcp://${REMOTE_HOST}:2375"

set -e

setenv() {
  if [[ -z ${DOCKER_HOST} ]]
  then
    echo "[ERROR] DOCKER_HOST not set"
    export DOCKER_HOST=${DOCKER_HOST}
  fi
  if [[ -z ${VERSION} ]]
  then
    echo "[ERROR] VERSION not set"
  fi

  export VERSION=${VERSION}
}

compose() {
  docker-compose -f build/docker-compose.yml -p ${PROJECT} $@
}


kraken() {
  KRAKEN_SERVICE="kraken-service"
  export RC_HOSTNAME=${REMOTE_HOST}

  # may not be necessary
  setenv

  echo "deploying the kraken service:"
  echo "  docker host: ${DOCKER_HOST}"
  echo "  version:     ${VERSION}"

  echo "stopping current service"
  compose stop ${KRAKEN_SERVICE}
  echo "removing current container"
  compose rm -f ${KRAKEN_SERVICE}
  echo "starting new container"
  compose up -d ${KRAKEN_SERVICE}
}

database() {
  DB_SERVICE="kraken-mysql"

  # may not be necessary
  setenv

  if [[ ! -z ${MYSQL_ROOT_PASSWORD} ]]
  then
    echo "setting MYSQL_ROOT_PASSWORD"
    export MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
  else
    echo "using default MYSQL_ROOT_PASSWORD"
    export MYSQL_ROOT_PASSWORD=${DEFAULT_MYSQL_ROOT_PASSWORD}
  fi

  echo "deploying the kraken database:"
  echo "  docker host: ${DOCKER_HOST}"
  echo "  version:     ${VERSION}"

  echo "stopping current service"
  compose stop ${DB_SERVICE}
  echo "removing current container"
  compose rm -f ${DB_SERVICE}
  echo "starting new container"
  compose up -d ${DB_SERVICE}
}

usage() {
  echo "kraken deploy.sh script for deploying onto a VM with docker installed:
  deploy.sh [FLAGS] [help|kraken|database]
  flags:
    required:
      --version [version]          | the version to deploy

    conditional:
      --dbpass [pass]              | the root passsword for the database. Required if deploying the database for the first time

    optional:
      --docker_host [docker host]  | override the docker host. Defaults to ${DOCKER_HOST}
  "
}

while [[ $# -gt 0 ]]
do
  key="$1"
  #look for key, get the next argument then skip over and repeat
  case $key in
    help)
        usage
        exit 0
    ;;
    kraken)
        kraken
        exit 0
    ;;
    database)
        database
        exit 0
    ;;
    --version)
        VERSION="$2"
        shift
    ;;
    --dbpass)
        MYSQL_ROOT_PASSWORD="$2"
        shift
    ;;
    --docker_host)
        DOCKER_HOST="$2"
        shift
    ;;
    *)
        echo "unrecognized command: $key"
        usage
        exit 0
    ;;
  esac
  shift
done
