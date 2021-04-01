FROM node:14 AS build
COPY . /miew
RUN cd /miew \
    && yarn global add lerna \
    && lerna bootstrap \
    && lerna run ci

FROM nginx:1.19.9-alpine
LABEL maintainer="miew@epam.com"
COPY --from=build /miew/packages/lib/build /usr/share/nginx/html
COPY --from=build /miew/packages/app/build /usr/share/nginx/html/app
