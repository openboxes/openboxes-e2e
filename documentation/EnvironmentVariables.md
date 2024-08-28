[Back to README](/README.md)


## Environment Variables
Environment variables facilitate the configuration of our testing project by allowing us to set appropriate configuration settings. A sample file can be located in the root directory of the project under the title `.env.example.` To configure this project effectively, it is imperative to create a `.env` file and declare all necessary variables within it.

```
**APP_BASE_URL** 
// base URL of the running openboxes environment
APP_BASE_URL=http://localhost:8080/openboxes/
```
```
// login credentials of the test user that will be used for most of the tests 
USER_MAIN_USERNAME=username 
USER_MAIN_USERNAME=password 
```
```
// login credentials of the alternative test user that can be used 
USER_ALT_USERNAME=username 
USER_ALT_PASSWORD=password 
```



[Read more about environment variables](documentation/EnvironmentVariables.md)


**CI** [optional]
<br>`true` or `false` flag indicating whether tests are running in Continuous Integration.

**USER_MAIN_USERNAME** <br> **USER_MAIN_PASSWORD** 
<br>login credentials of the test user that will be used for most of the tests 

**LOCATION_MAIN**
<br> `locationId` of the default location that will be used in most of the tests

**LOCATION_NO_MANAGE_INVENOTRY_DEPOT**
<br> `locationId` of the location with no manage inventory activity code
