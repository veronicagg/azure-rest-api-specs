## Ruby

These settings apply only when `--ruby` is specified on the command line.

```yaml
package-name: azure_mgmt_Service8
package-version: 2019-03-01
azure-arm: true
```

### Tag: package-2019-03-01 and ruby

These settings apply only when `--tag=package-2019-03-01 --ruby` is specified on the command line.
Please also specify `--ruby-sdks-folder=<path to the root directory of your azure-sdk-for-ruby clone>`.

```yaml $(tag) == 'package-2019-03-01' && $(ruby)
namespace: Microsoft.Service8
output-folder: $(ruby-sdks-folder)/Service8
```
