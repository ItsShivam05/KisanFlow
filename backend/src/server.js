require("dotenv").config();

const { app } = require("./app");

const rawPort = Number(process.env.PORT);
const port = rawPort && rawPort !== 3000 ? rawPort : 5000;

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  throw new Error("JWT_SECRET and DATABASE_URL must be set. Copy .env.example to .env.");
}

app.listen(port, () => {
  console.log(`KisanFlow API running at http://localhost:${port}`);
});
