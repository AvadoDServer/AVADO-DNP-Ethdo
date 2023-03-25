ARG UPSTREAM_VERSION

FROM node:16.15.0 as builder

# build wizard
WORKDIR /usr/src/app/wizard
COPY wizard .
RUN npm i
RUN npm run build 

# Monitor
WORKDIR /usr/src/monitor
COPY monitor .
RUN rm -Rf build && yarn run build

FROM --platform=linux/amd64 wealdtech/ethdo:${UPSTREAM_VERSION}

USER root
RUN apt-get -y update && apt-get -y upgrade && apt-get -y install \
    curl \
    gettext\
    jq \
    nginx \
    nodejs \
    procps \
    sudo \
    supervisor \
    vim-tiny \
    && rm -rf /var/lib/apt/lists/*
RUN useradd -s /bin/false nginx

# Instal node v18.15.0
RUN curl https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash \
    && . /root/.nvm/nvm.sh \
    && nvm install v18.15.0 \
    && nvm use v18.15.0

# RUN mkdir /data  && chown user /data
VOLUME /data

# copy wizard & monitor
COPY --from=builder /usr/src/app/wizard/out /usr/local/wizard
COPY --from=builder /usr/src/monitor/ /usr/local/monitor

COPY startNimbus.sh /opt/nimbus/
COPY reload-certs.sh /opt/nimbus/reload-certs.sh
RUN chmod a+x /opt/nimbus/startNimbus.sh /opt/nimbus/reload-certs.sh
COPY supervisord.conf /etc/supervisord.conf
COPY nginx.conf /etc/nginx/

# EXPOSE 5052
# USER user
# RUN curl "http://iso.ava.do/my.ava.do.crt" --output /opt/nimbus/my.ava.do.crt --silent
# RUN curl "http://iso.ava.do/my.ava.do.key" --output /opt/nimbus/my.ava.do.key --silent

USER root
WORKDIR /
ENTRYPOINT ["supervisord", "--nodaemon", "--configuration", "/etc/supervisord.conf"]