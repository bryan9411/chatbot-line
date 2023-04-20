# 使用 Node 18 作為基底映像檔
FROM node:18

# 建立一個工作目錄
WORKDIR /app

# 複製 package.json 與 yarn.lock 並且執行 yarn install 安裝相依套件
COPY package.json yarn.lock ./
RUN yarn install

# 將專案代碼複製到映像檔中的 /app 目錄下
COPY . .

# 執行應用程式，使用 `yarn start` 命令啟動
CMD [ "yarn", "start" ]