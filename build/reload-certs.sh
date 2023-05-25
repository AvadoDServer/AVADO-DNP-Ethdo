#!/bin/sh
while true; do
    date > /tmp/reload-certs.txt

    echo "Check for updated certificates"

    md5sumbefore=$(md5sum "/etc/nginx/my.ava.do.crt") 2>/dev/null
    curl "http://dappmanager.my.ava.do/my.ava.do.crt" --output /etc/nginx/my.ava.do.crt --silent
    curl "http://dappmanager.my.ava.do/my.ava.do.key" --output /etc/nginx/my.ava.do.key --silent
    md5sumafter=$(md5sum "/etc/nginx/my.ava.do.crt")

    if [ "$md5sumbefore" != "$md5sumafter" ]; then
        echo "Updated certificates - restarting services"
        supervisorctl restart nginx
    fi

    #sleep one day
    sleep 86400
done
