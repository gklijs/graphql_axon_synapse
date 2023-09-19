# Demo Application leveraging Axon Synapse to add a GraphQL endpoint

## Quickstart

The application contains 3 major parts, you need all of them to be able to execute commands successfully.
1. Infra components, Axon Server, Axon Synapse and MongoDB. Start with `docker console up -d` in the `docker` folder. In [projection](deno/projection.ts) we assume the Deno app can be reached via `http://host.docker.internal:3000/events` from Synapse which might not be the case in your docker setup.
2. JVM app which handles commands, builds his own projection, and has a basic ui. Run `./mvnw spring-boot:run` in the main folder to start. You do need Java installed.
3. A Deno app, which has its own projection in MongoDB, Run `deno run --allow-net --allow-read --import-map ./import_map.json server.ts` in the `deno` folder, you do need to have Deno installed.

## Where to find more information

* The [Axon Reference Guide](https://docs.axoniq.io/reference-guide/) is definitive guide on the Axon Framework and Axon Server.
* Visit [www.axoniq.io](https://www.axoniq.io) to find out about AxonIQ, the team behind the Axon Framework and Server.
* Subscribe to the [AxonIQ YouTube channel](https://www.youtube.com/AxonIQ) to get the latest Webinars, announcements, and customer stories.
* To start a fresh Axon Application, you can go to [start.axoniq.io](https://start.axoniq.io/).
* Additional information may be gained by following some of AxonIQ's courses on the [AxonIQ Academy](https://academy.axoniq.io/).
* The latest version of the Giftcard App can be found [on GitHub](https://github.com/AxonIQ/giftcard-demo).
* Docker images for Axon Server are pushed to [Docker Hub](https://hub.docker.com/u/axoniq).
* If there are any Axon related questions remaining, you can always go to the [forum](https://discuss.axoniq.io/).

## Components

More information about some of the components involved

### The Giftcard app(JVM)

It's a Axon Framework application, which has been [forked](https://github.com/AxonIQ/giftcard-demo). The fork might diverge at some points. The major difference is that within this project, its using MongoDB to store the projection.

## Background story

See [the wikipedia article](https://en.wikipedia.org/wiki/Gift_card) for a basic definition of gift cards. Essentially, there are just two events in the life cycle of a gift card:
* They get _issued_: a new gift card gets created with some amount of money stored.
* They get _redeemed_: all or part of the monetary value stored on the gift card is used to purchase something.

## Structure of the App

The Giftcard application is split into four parts, using four sub-packages of `io.axoniq.demo.giftcard`:
* The `api` package contains the ([Java Records](https://www.baeldung.com/java-record-keyword)) sourcecode of the messages and entity. They form the API (sic) of the application.
* The `command` package contains the GiftCard Aggregate class, with all command- and associated eventsourcing handlers.
* The `query` package provides the query handlers, with their associated event handlers.
* The `rest` package contains the [Spring Webflux](https://www.baeldung.com/spring-webflux)-based Web API.

## Building the Giftcard app from the sources

To build the demo app, simply run the provided [Maven wrapper](https://www.baeldung.com/maven-wrapper):

```
./mvnw clean package
```

Note that the Giftcard app expects JDK 17 to be used. 

## Running the Giftcard app

The simplest way to run the app is by using the Spring-boot maven plugin:

```
./mvnw spring-boot:run
```
However, if you have copied the jar file `giftcard-demo-1.0.jar` from the Maven `target` directory to some other location, you can also start it with:

```
java -jar giftcard-demo-1.0.jar
```
The Web GUI can be found at [`http://localhost:8080`](http://localhost:8080).

## Axon Server

Axon server is both a event store and a message router. It was developed to work well together with Axon Framework applications.

### Running Axon Server

By default, the Axon Framework is configured to expect a running Axon Server instance, and it will complain if the server is not found. 
To run Axon Server, you'll need a Java runtime.  
A copy of the server JAR file has been provided in the demo package. 
You can run it locally, in a Docker container or on a separate server.

The section below give a fair description on how to run Axon Server for this sample project.
If you are looking for more in depth information on the subject, we recommend this three-part blog series:

1. [Running Axon Server - Going from local developer install to full-featured cluster in the cloud](https://axoniq.io/blog-overview/running-axon-server)
2. [Running Axon Server in Docker - Continuing from local developer install to containerized](https://axoniq.io/blog-overview/running-axon-server-in-docker)
3. [Running Axon Server in a Virtual Machine](https://axoniq.io/blog-overview/running-axon-server-in-a-virtual-machine)

### Running Axon Server locally

To run Axon Server locally, all you need to do is put the server JAR file in the directory where you want it to live, and start it using:

```
java -jar axonserver.jar
```

You will see that it creates a subdirectory `data` where it will store its information.

### Running Axon Server in a Docker container

To run Axon Server in Docker you can use the image provided on Docker Hub:

```
$ docker run -d --name my-axon-server -p 8024:8024 -p 8124:8124 axoniq/axonserver
...some container id...
$
```

### Configuring Axon Server

Axon Server uses sensible defaults for all of its settings, so it will actually run fine without any further configuration.
However, if you want to make some we recommend checking out the [Configuration section](https://docs.axoniq.io/reference-guide/axon-server/administration/admin-configuration/configuration) of the Reference Guide.

### Axon Server HTTP server

Axon Server provides two servers; one serving HTTP requests, the other gRPC. 
By default, these use ports 8024 and 8124 respectively, but you can change these in the settings.

The HTTP server has in its root context a management Web GUI, a health indicator is available at `/actuator/health`, and the REST API at `/v1`. 
The API's Swagger endpoint finally, is available at `/swagger-ui.html`, and gives the documentation on the REST API.

## Axon Synapse 

Axon Synapse has its own ui, available at `localhost:8081` when using the docker compose. You can see things like which applications are connected.

## Deno

run with `deno run --allow-net --allow-read --import-map ./import_map.json server.ts` in the deno folder. You need to have [Deno](https://docs.deno.com/runtime/manual/getting_started/installation) installed.

