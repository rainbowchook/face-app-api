FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
# RUN npm install --production --silent && mv node_modules ../
RUN npm ci \
    && npm cache clean --force
ENV PATH /app/node_modules/.bin:$PATH
COPY . .
ENV NODE_ENV=production
RUN npm run build
RUN npm prune --production
EXPOSE 3000
RUN chown -R node /app
USER node
CMD ["node", "build/server.js"]
