FROM node:20 as build-deps

WORKDIR /opt/app

COPY . .

RUN yarn

RUN yarn build


FROM nginx

ARG VITE_VERSION_STRING
ENV VITE_VERSION_STRING=$VITE_VERSION_STRING

COPY docker-entrypoint.sh /usr/bin/docker-entrypoint.sh
COPY --from=build-deps /opt/app/dist /usr/share/nginx/html

# write environment variables to config file and start
ENTRYPOINT ["/usr/bin/docker-entrypoint.sh"]

CMD ["nginx","-g","daemon off;"]
