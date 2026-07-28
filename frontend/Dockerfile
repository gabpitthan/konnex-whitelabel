FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ARG REACT_APP_BACKEND_URL
ARG REACT_APP_NUMBER_SUPPORT
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV REACT_APP_NUMBER_SUPPORT=$REACT_APP_NUMBER_SUPPORT
ENV REACT_APP_LOCALE=pt-br
ENV REACT_APP_TIMEZONE=America/Sao_Paulo
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
