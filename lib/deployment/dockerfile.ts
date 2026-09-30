import fs from "fs/promises";
import path from "path";

export async function ensureDockerfile(
  workspacePath: string,
  runtime: string,
  containerPort = 3000,
  logCallback?: (msg: string) => void
): Promise<string> {
  const dockerfilePath = path.join(workspacePath, "Dockerfile");

  // If repo already has a Dockerfile, use it
  try {
    await fs.access(dockerfilePath);
    if (logCallback) logCallback("[Builder] Found existing Dockerfile in repository root. Using it.");
    return dockerfilePath;
  } catch {
    // Generate Dockerfile based on selected runtime
  }

  let generatedDockerfile = "";

  if (runtime === "nextjs") {
    generatedDockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm install; fi
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    elif [ -f yarn.lock ]; then yarn build; \
    else npm run build; fi

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=${containerPort}
ENV HOSTNAME="0.0.0.0"
COPY --from=builder /app ./
EXPOSE ${containerPort}
CMD ["npm", "start"]
`;
  } else if (runtime === "nodejs") {
    generatedDockerfile = `FROM node:20-alpine
WORKDIR /app
COPY package*.json pnpm-lock.yaml* yarn.lock* ./
RUN if [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm install; fi
COPY . .
ENV PORT=${containerPort}
ENV NODE_ENV=production
EXPOSE ${containerPort}
CMD ["npm", "start"]
`;
  } else if (runtime === "python") {
    generatedDockerfile = `FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV PORT=${containerPort}
COPY requirements*.txt ./
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi
COPY . .
EXPOSE ${containerPort}
CMD if [ -f main.py ]; then python main.py; elif [ -f app.py ]; then python app.py; else uvicorn main:app --host 0.0.0.0 --port ${containerPort}; fi
`;
  } else if (runtime === "laravel") {
    generatedDockerfile = `FROM php:8.2-cli-alpine
WORKDIR /app
RUN apk add --no-cache curl zip unzip git
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction
ENV PORT=${containerPort}
EXPOSE ${containerPort}
CMD php artisan serve --host=0.0.0.0 --port=${containerPort}
`;
  } else {
    // Default fallback
    generatedDockerfile = `FROM node:20-alpine
WORKDIR /app
COPY . .
RUN if [ -f package.json ]; then npm install; fi
ENV PORT=${containerPort}
EXPOSE ${containerPort}
CMD ["npm", "start"]
`;
  }

  if (logCallback) logCallback(`[Builder] Generated standard Dockerfile for runtime: ${runtime}`);
  await fs.writeFile(dockerfilePath, generatedDockerfile, "utf8");
  return dockerfilePath;
}
