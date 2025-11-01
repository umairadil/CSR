# Production image for Next.js app
FROM node:20-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || yarn install || pnpm install

COPY . .

RUN npm run build

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]












