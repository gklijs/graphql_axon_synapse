# Apple Silicon

If you are running on Apple Silicon Mac, you will run into an issue with the `bitnami/mongodb:6.0.10` in
[docker-compose.yml](docker-compose.yml): it does not support arm64.

To work around this, you will need to build your own:

1. Build an arm64 image of MongoDB:
    ```shell
    docker buildx create --name mybuilder
    docker buildx use mybuilder
    docker buildx build --platform linux/arm64 --load -t my-mongo-arm64:latest -f Dockerfile_mongo .
    ```
2. Replace the mongo section in [docker-compose.yml](docker-compose.yml) with this:
    ```yaml
      mongodb:
        image: my-mongo-arm64:latest
        command: [ "mongod", "--bind_ip_all", "--replSet", "rs0" ]
        ports:
          - "27017:27017"
        environment:
          - MONGODB_REPLICA_SET_MODE=primary
          - ALLOW_EMPTY_PASSWORD=yes
        networks:
          - giftcard-demo-network
    ```
   Compared to original, it uses the image you just built and adds `command` line that makes mongo run in as a member
   of a replica set as opposed to standalone server: some operation seeks to use a transaction which needs a replica set
   configured in [mongo-init.js](mongo-init.js).
3. Start Axon, Synapse and MongoDB with:
    ```shell
    docker-compose -f docker-compose.yml up -d --build
    ```
4. Follow the rest of instructions in [README.md](../README.md) to build and run the GiftCard and the Deno apps.

You can stop docker by running:
```shell
docker-compose -f docker-compose.yml down
```
