FROM node:22-alpine
WORKDIR /agent
COPY agent/interpret.mjs agent/gemini.mjs agent/server.mjs ./
ENV PORT=4318
ENV HOST=0.0.0.0
EXPOSE 4318
CMD ["node", "server.mjs"]
