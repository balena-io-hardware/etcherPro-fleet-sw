FILE=/usr/src/diag-data/startup.lock
if [ -f "$FILE" ]; then
    echo "$FILE exists, not starting service."
    curl --header "Content-Type:application/json" "$BALENA_SUPERVISOR_ADDRESS/v2/applications/$BALENA_APP_ID/stop-service?apikey=$BALENA_SUPERVISOR_API_KEY" -d '{"serviceName": "diag-runner", "force": true}' 
else 
    node ./bin/www
fi