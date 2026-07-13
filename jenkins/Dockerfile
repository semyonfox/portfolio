FROM jenkins/jenkins:lts-jdk21

ENV VP_HOME=/opt/vite-plus
ENV PATH="${VP_HOME}/bin:${PATH}"

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      docker.io \
      docker-compose \
      git \
      jq && \
    curl -fsSL https://vite.plus | VP_VERSION=0.2.4 bash && \
    chown -R jenkins:jenkins "$VP_HOME" && \
    rm -rf /var/lib/apt/lists/*

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

COPY init.groovy.d/ /usr/share/jenkins/ref/init.groovy.d/
