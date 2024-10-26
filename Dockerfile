FROM node:20 AS build

ENV buildDir=/opt/app
RUN mkdir -p ${buildDir}
WORKDIR ${buildDir}

# Install node dependencies
COPY ["yarn.lock", "package.json", "tsconfig.json", "${buildDir}/"]
RUN yarn

# Build the code
ARG BUILD_NUMBER
ENV BUILD_NUMBER=${BUILD_NUMBER:-0}
COPY . .
RUN yarn target build

FROM node:20 AS prod

ENV buildDir=/opt/app
RUN mkdir -p ${buildDir}
WORKDIR ${buildDir}
RUN mkdir /config

# prod dependencies
COPY ["yarn.lock", "package.json", "${buildDir}/"]
RUN yarn install --production

COPY --from=build ["${buildDir}/dist/", "${buildDir}/dist/"]
COPY --from=build ["${buildDir}/src/", "${buildDir}/src/"]
COPY ["public/", "${buildDir}/public/"]
COPY ["config/", "${buildDir}/config/"]
COPY ["server.ts", "index.html", "${buildDir}/"]

ENV NODE_ENV=production
EXPOSE 80
CMD ["yarn", "tsx", "server", "--merge-config"]
