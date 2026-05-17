# Gunakan node versi 22 (biar sama dengan backend)
FROM node:22

# Set folder kerja di dalam container
WORKDIR /usr/src/app

# Copy file package dulu biar install depedensi lebih cepat (caching)
COPY package*.json ./

# Install semua library frontend
RUN npm install

# Copy sisa kodingan frontend
COPY . .

# Vite biasanya pakai port 5173
EXPOSE 5173

# Jalankan perintah dev server
CMD ["npm", "run", "dev", "--", "--host"]