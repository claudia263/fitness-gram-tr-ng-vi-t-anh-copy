# --- build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
# Vite nhúng biến VITE_* lúc build → phải truyền dưới dạng build arg (Coolify: Build Variables)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build
# nginx chuyển tiếp /api/major-os/* sang Supabase → điền host + anon key (công khai) vào cấu hình
RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_ANON_KEY" \
 && host="${VITE_SUPABASE_URL#https://}" && host="${host%/}" \
 && sed -e "s|__SUPABASE_HOST__|${host}|g" -e "s|__SUPABASE_ANON_KEY__|${VITE_SUPABASE_ANON_KEY}|g" nginx.conf > nginx.generated.conf

# --- serve ---
FROM nginx:1.27-alpine
COPY --from=build /app/nginx.generated.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
RUN nginx -t
EXPOSE 80
