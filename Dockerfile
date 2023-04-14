FROM node:18

ENV NODE_ENV production
ENV buildDir /opt/app
RUN mkdir -p ${buildDir}
WORKDIR ${buildDir}
RUN mkdir /config
CMD ["tsx", "server", "--merge-config"]

# Install node dependencies
COPY ["yarn.lock", "package.json", "tsconfig.json", "${buildDir}/"]
RUN yarn

# Build the code
ARG BUILD_NUMBER
ENV BUILD_NUMBER ${BUILD_NUMBER:-0}
COPY . .
RUN yarn target build
