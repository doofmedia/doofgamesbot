VERSION=`cat version.txt`

.PHONY: build
build:
	docker build -t doofmedia/doofbot:version:$(VERSION) .

.PHONY: push
push:
	docker push doofmedia/doofbot:version:$(VERSION)

.PHONY: run
run:
	docker run --restart=always -e DBPASS=${DBPASS} -e BOTPASS=${BOTPASS} -t croselius/doofbot:version$(VERSION)

.PHONY: dev
dev:
	docker run -d --restart=always -e DOOFDEVMODE=true -e DBPASS=${DBPASS} -e BOTPASS=${BOTPASS} -t croselius/doofbot:version$(VERSION)