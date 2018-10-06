# initial configuration
- create a new cluster
- auth to gcloud
- auth to target cluster
- grant role creation permissions to yourself ```kubectl create clusterrolebinding myname-cluster-admin-binding --clusterrole=cluster-admin --user=myname@example.org```
- enable gcloud compute api
- create gcloud service account
  - grant create/read/delete permissions for disks, snapshots, and ip addresses
- update with desired settings then apply all configs in deployment/init-kube
- build and deploy latest cloudrest & tasks ```npm run deploy:latest```
