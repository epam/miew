FROM node:22 AS build
COPY . /miew
RUN cd /miew \
    && yarn \
    && yarn run ci

FROM nginx:1.25-alpine
LABEL maintainer="miew@epam.com"
COPY --from=build /miew/packages/miew/build /usr/share/nginx/html
COPY --from=build /miew/packages/miew-app/build /usr/share/nginx/html/app
