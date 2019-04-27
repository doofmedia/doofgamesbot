VERSION=`cat version.txt`

.PHONY: build
build:
	docker build -t croselius/doofbot:version$(VERSION) .

.PHONY: push
push:
	docker push croselius/doofbot:version$(VERSION)

.PHONY: run
run:
	docker run -t croselius/doofbot:version$(VERSION)