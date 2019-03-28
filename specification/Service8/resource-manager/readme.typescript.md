## TypeScript

These settings apply only when `--typescript` is specified on the command line.
Please also specify `--typescript-sdks-folder=<path to root folder of your azure-sdk-for-js clone>`.

```yaml $(typescript)
typescript:
  azure-arm: true
  package-name: "Service8"
  output-folder: "$(typescript-sdks-folder)/packages/Service8"
  payload-flattening-threshold: 1
  generate-metadata: true
```
