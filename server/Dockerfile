FROM node:22-alpine
WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV PORT=8787
ENV DB_PATH=/data/hogwarts.sqlite
VOLUME /data
EXPOSE 8787
CMD ["node", "--experimental-strip-types", "src/index.ts"]
