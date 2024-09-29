# Socket-Draw 多人共筆畫版

![專案封面圖](https://i.imgur.com/lp574tU.png)

## 說明
此專案是一個共筆畫板，使用者可以在此上面塗鴉並與其他使用者即時互動，同時可以在畫板上傳圖片，對圖片做出拖曳等操作。
前端以React.js來撰寫的Side Project，在此之前為我自己獨立撰寫的Vue專案。</br>
後端是使用Socket.io來實現即時通訊，並且使用P5.js來實現畫布功能。</br>
當使用者成功登入Socket Server後，系統會隨機配置一個顏色，該顏色就會是使用者的畫筆與圖片拖曳的提示顏色，該顏色是為了辨識使用者所配發的，因此沒有設置修改顏色的功能。除了配置顏色外，同時也會將當前Server上的紀錄回傳給Client，像是其他使用者的畫筆與圖片紀錄，當Client接收到這些紀錄後，會進行初始化渲染，接下來才會開始做其他動作，此舉是為了同步每Client當前的狀態所設計的。</br>
為了降低多人操同操作大量傳遞socket事件會造成Server負擔，在前端有帶特別設置降低流量的操作，像是修改畫筆更新的頻率等，同時也能在多人操作時降低前端Canvas渲染的負擔。</br>
除了畫筆外，也有設置圖片上傳的功能，圖片上傳後，會以base64的格式傳遞給其他使用者，讓其同步顯示在自己的畫面上，並且能夠以點擊圖片來選定圖片，並且移動滑鼠做出拖移的效果。</br>
為了避免多人同時操作同一張圖片，造成的操作混亂，因此在點擊選定時就會發送事件給其他使用者，讓其他使用者無法操作被選定的圖片。圖片的移動則是以傳所送圖片當前座標的方式。</br>

## 功能

- Socket.io多人連線
- 上傳圖片
- 拖拉圖片位置
- 畫筆塗鴉

## 使用工具

- React.js
- Socket.io
- P5.js
- Tailwind css
- TypeScript
- Material UI
- Vite

## 畫面

![範例圖片 1](https://resume.jinchengliang.com/assets/images/portfolio/socket-draw/cover.gif)

## 安裝

以下將會引導你如何安裝此專案到你的電腦上。

Node.js 版本建議為：`v18.19.0` 以上...

### 取得專案

```bash
git clone https://github.com/cs2338139/socket-draw.git
```

## Client端

### 移動到專案Client內

```bash
cd Client
```

### 安裝套件

```bash
yarn install
```

or

```bash
npm install
```

### 環境變數設定

請在終端機輸入 `cp .env.template .env` 來複製 .env.example 檔案，並依據 `.env.local` 內容調整相關欄位。

### 運行專案

```bash
yarn dev
```

### 開啟專案

在瀏覽器網址列輸入以下即可看到畫面

```bash
http://localhost:3000/
```

## 環境變數說明

```env
VITE_PORT=3000 #Port號
VITE_SOCKET_URL=http://localhost:3333 ＃Socket Server Url
```

## Server端

### 移動到專案Server內

```bash
cd Server
```

### 安裝套件

```bash
yarn install
```

or

```bash
npm install
```

### Server設定

Server的設定檔放置在./Server/Data/Setting.js裡面，可以開啟進行修改

### 運行專案

```bash
yarn start
```

## 設定檔變數說明

``` javascript
//靜態設定
export const setting = {
  //連線設定
  connect: {
    // corsUrl: "*",
    corsUrl: ["http://localhost:3000",'http://localhost:3001'],
    port: "3333",
  },
};
```

## 聯絡作者

你可以透過以下方式與我聯絡

- [Github](https://github.com/cs2338139)
