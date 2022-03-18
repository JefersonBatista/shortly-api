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

    await connection.query(
      `UPDATE urls
        SET "visitCount" = "visitCount" + 1
      WHERE "shortUrl"=$1`,
      [shortUrl]
    );

    const [{ url }] = urlResult.rows;

    res.redirect(url);
  } catch (error) {
    console.error(error);
    res.status(500).send("Houve um erro interno no servidor");
  }
}

export async function deleteUrl(req, res) {
  const id = parseInt(req.params.id);

  const { user } = res.locals;

  try {
    const urlDeletionResult = await connection.query(
      `DELETE FROM urls WHERE id=$1 AND "userId"=$2`,
      [id, user.id]
    );

    if (urlDeletionResult.rowCount < 1) {
      return res.status(401).send("A URL encurtada com esse ID não é sua");
    }

    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).send("Houve um erro interno no servidor");
  }
}
