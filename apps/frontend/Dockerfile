FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./

RUN if [ -f "pnpm-lock.yaml" ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    else \
      npm ci; \
    fi

COPY . .

ARG VITE_API_URL
ARG VITE_USE_MOCK
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCK=$VITE_USE_MOCK
RUN npm run build

FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
