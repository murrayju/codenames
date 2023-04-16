FROM node:18

ENV buildDir /opt/app
RUN mkdir -p ${buildDir}
WORKDIR ${buildDir}
RUN mkdir /config

# Install node dependencies
COPY ["yarn.lock", "package.json", "tsconfig.json", "${buildDir}/"]
RUN yarn

# Build the code
ARG BUILD_NUMBER
ENV BUILD_NUMBER ${BUILD_NUMBER:-0}
COPY . .
RUN yarn target build

ENV NODE_ENV production
CMD ["yarn", "tsx", "server", "--merge-config"]
