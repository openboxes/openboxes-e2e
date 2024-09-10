[↩️ Back to README](/README.md)


# 🔠  Environment Variables
Environment variables facilitate the configuration of our testing project by allowing us to set appropriate configuration settings. A sample file can be located in the root directory of the project under the title `.env.example.` To configure this project effectively, it is imperative to create a `.env` file and declare all necessary variables within it.

## ❗ Required variables

_base URL of the running openboxes environment_
```
APP_BASE_URL=http://localhost:8080/openboxes/
```

_login credentials of the test user that will be used for most of the tests_
```
USER_MAIN_USERNAME=username 
USER_MAIN_USERNAME=password 
```

_login credentials of the alternative test user that can be used_
``` 
USER_ALT_USERNAME=username 
USER_ALT_PASSWORD=password 
```

_`locationId` of the default location that will be used in most of the tests_
```
LOCATION_MAIN=locationIdHash
```

## ⚪ Optional variables

_[optional]_ `true` or `false` flag indicating whether tests are running in Continuous Integration.
```
CI=false
```

### Locations

_`locationId` of the location with no manage inventory activity code_
```
LOCATION_NO_MANAGE_INVENOTRY_DEPOT=locationIdHash
```

_`locationId` of the location of type supplier_
```
LOCATION_SUPPLIER=locationIdHash
```

_`locationId` of the location of type supplier_
```
LOCATION_SUPPLIER_ALT=locationIdHash
```


_`locationId` of the location of type depot_
```
LOCATION_DEPOT=locationIdHash
```

### Products

_`productId` of an available product_
```
PRODUCT_ONE=productIdHash
```

_`productId` of an available product_
```
PRODUCT_TWO=productIdHash
```

