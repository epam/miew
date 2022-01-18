FROM node:14 AS build
COPY . /miew
RUN cd /miew \
    && yarn install \
    && yarn build:ci

FROM nginx:1.21-alpine
LABEL maintainer="miew@epam.com"
COPY --from=build /miew/packages/miew/build /usr/share/nginx/html
COPY --from=build /miew/packages/miew-app/build /usr/share/nginx/html/app
