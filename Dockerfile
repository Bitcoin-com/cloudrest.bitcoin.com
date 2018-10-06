FROM node:8

# Update apt-get sources
RUN apt-get update --yes

# Install build tools
RUN apt-get install --yes build-essential wget \
	&& apt-get -y autoclean

# Install app dependencies
RUN mkdir /app
COPY package.json /app/
RUN cd /app; npm install

# Copy source
RUN mkdir /app/bin /app/config /app/src /app/tasks
COPY bin/ /app/bin/
COPY config/ /app/config/
COPY src/ /app/src/
COPY tasks/ /app/tasks/
COPY index.js seed-db.js /app/

# Install pm2 and copy process.json
RUN npm install pm2 -g
COPY process.json /app/

# Expose ports
EXPOSE  5000

CMD ["pm2-runtime", "start", "/app/process.json"]
