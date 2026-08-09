FROM node:20-alpine

# Install OpenSSL required by Prisma Engine on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate --schema=prisma/schema.prisma

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]