FROM node:10 as build-deps

WORKDIR /opt/app

COPY . .

RUN yarn

RUN yarn build


FROM nginx
COPY --from=build-deps /opt/app/build /usr/share/nginx/html
