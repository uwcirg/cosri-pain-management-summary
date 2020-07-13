FROM node:10 as build-deps

WORKDIR /opt/app

COPY . .

RUN yarn

RUN yarn build


FROM nginx
COPY docker-entrypoint.sh /usr/bin/docker-entrypoint.sh
COPY --from=build-deps /opt/app/build /usr/share/nginx/html

# write environment variables to config file and start
ENTRYPOINT ["/usr/bin/docker-entrypoint.sh"]

CMD ["nginx","-g","daemon off;"]
