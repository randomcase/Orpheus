.PHONY: build test report serve clean

build:
	cd go-engine && go build -o ../bin/orpheus-engine ./cmd/orpheus-engine
	cd springboot-app && ./gradlew bootJar --no-daemon

test:
	cd go-engine && go test -v -race -coverprofile=coverage.out ./...
	cd go-engine && go test -bench=. -benchmem ./internal/translit
	cd springboot-app && ./gradlew test jacocoTestReport --no-daemon
	python scripts/build_portal_and_report.py

report:
	python scripts/build_portal_and_report.py

serve:
	pwsh -File scripts/orpheus.ps1 serve

clean:
	rm -rf bin reports/*.tmp
