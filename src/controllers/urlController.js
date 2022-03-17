import { v4 as uuid } from "uuid";
import { connection } from "../database.js";

function generateShortUrl() {
  return uuid().slice(0, 8);
}

export async function shortenUrl(req, res) {
  const { url } = req.body;

  const { user } = res.locals;

  const shortUrl = generateShortUrl();

  try {
    await connection.query(
      `INSERT INTO urls (url, "shortUrl", "userId") VALUES ($1, $2, $3)`,
      [url, shortUrl, user.id]
    );

    res.status(201).send({ shortUrl });
  } catch (error) {
    console.error(error);
    res.status(500).send("Houve um erro interno no servidor");
  }
}

export async function getUrl(req, res) {
  const { shortUrl } = req.params;

  try {
    const urlResult = await connection.query(
      `SELECT id, "shortUrl", url FROM urls WHERE "shortUrl"=$1`,
      [shortUrl]
    );

    if (urlResult.rowCount < 1) {
      return res.status(404).send("A URL encurtada não existe");
    }

    const [url] = urlResult.rows;

    res.status(200).send(url);
  } catch (error) {
    console.error(error);
    res.status(500).send("Houve um erro interno no servidor");
  }
}
