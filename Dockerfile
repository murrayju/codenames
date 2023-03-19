FROM node:18 as builder

ENV buildDir /opt/build
RUN mkdir -p ${buildDir}
WORKDIR ${buildDir}

# Install node dependencies
COPY ["yarn.lock", "package.json", "tsconfig.json", "${buildDir}/"]
RUN yarn

# Build the code
ARG BUILD_NUMBER
ENV BUILD_NUMBER ${BUILD_NUMBER:-0}
COPY . .
RUN yarn target publish --release

# Defaults when running this container
EXPOSE 443
ENTRYPOINT ["yarn", "target"]
CMD ["server"]

###
# Production image. Only include what is needed for production
###
FROM node:18 as production

ENV appDir /opt/app
RUN mkdir -p ${appDir}
WORKDIR ${appDir}

ENV NODE_ENV production

COPY --from=builder ["/opt/build/build/", "${appDir}/"]

RUN mkdir /config

CMD ["node", "./server.js", "--merge-config"]
