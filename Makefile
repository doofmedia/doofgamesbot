VERSION=`cat version.txt`

.PHONY: build
build:
	docker build --no-cache -t croselius/doofbot:$(VERSION) .

.PHONY: push
push:
	docker push croselius/doofbot:$(VERSION)

.PHONY: run
run:
	docker run -e DBPASS=${DBPASS} -e BOTPASS=${BOTPASS} -t croselius/doofbot:$(VERSION)

.PHONY: run2
run2:
	DBPASS=${DBPASS} BOTPASS=${BOTPASS} VERSION=$(VERSION) docker-compose up