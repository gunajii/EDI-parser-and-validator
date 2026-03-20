FROM node:20
WORKDIR /app
COPY apps/api/package.json /app/package.json
RUN npm install
COPY apps/api/src /app/src
CMD ["npm", "run", "start"]
