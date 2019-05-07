## Ruby

These settings apply only when `--ruby` is specified on the command line.

```yaml
package-name: azure_mgmt_service22
package-version: 2019-02-18
azure-arm: true
```

### Tag: package-2019-02-18 and ruby

These settings apply only when `--tag=package-2019-02-18 --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2019-02-18' && $(ruby)
namespace: Microsoft.Service22
output-folder: $(ruby-sdks-folder)/service22
```
