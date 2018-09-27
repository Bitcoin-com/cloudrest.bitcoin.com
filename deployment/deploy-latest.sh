#!/bin/bash
randomTag=$(openssl rand -hex 12)
docker build -t cloudrest:latest .
docker tag cloudrest:latest gcr.io/bitbox-cloud-stage/cloudrest:$randomTag
docker push gcr.io/bitbox-cloud-stage/cloudrest:$randomTag
kubectl set image deployment/cloudrest-deploy cloudrest=gcr.io/bitbox-cloud-stage/cloudrest:$randomTag
