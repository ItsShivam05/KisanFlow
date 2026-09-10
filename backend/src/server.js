require("dotenv").config();

const { app } = require("./app");

const port = Number(process.env.PORT) || 5000;

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL) {
  throw new Error("JWT_SECRET and DATABASE_URL must be set. Copy .env.example to .env.");
}

app.listen(port, () => {
  console.log(`KisanFlow API running at http://localhost:${port}`);
});
