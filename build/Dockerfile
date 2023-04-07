ARG UPSTREAM_VERSION

FROM node:18.15.0 as builder

# build wizard
WORKDIR /usr/src/app/wizard
COPY wizard .
RUN yarn
RUN yarn build

# Monitor
WORKDIR /usr/src/monitor
COPY monitor .
RUN yarn
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

RUN curl "https://iso.ava.do/my.ava.do.crt" --output /etc/nginx/my.ava.do.crt --silent
RUN curl "https://iso.ava.do/my.ava.do.key" --output /etc/nginx/my.ava.do.key --silent

COPY supervisord.conf /etc/supervisord.conf
COPY nginx.conf /etc/nginx/

USER root
WORKDIR /
ENTRYPOINT ["supervisord", "--nodaemon", "--configuration", "/etc/supervisord.conf"]