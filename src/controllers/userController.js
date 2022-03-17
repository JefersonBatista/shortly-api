import bcrypt from "bcrypt";
import { connection } from "../database.js";

export async function createUser(req, res) {
  const user = req.body;

  try {
    const existingUsers = await connection.query(
      "SELECT * FROM users WHERE email=$1",
      [user.email]
    );
    if (existingUsers.rowCount > 0) {
      return res.sendStatus(409);
    }

    const passwordHash = bcrypt.hashSync(user.password, 10);

    await connection.query(
      `
      INSERT INTO 
        users(name, email, password) 
      VALUES ($1, $2, $3)
    `,
      [user.name, user.email, passwordHash]
    );

    res.sendStatus(201);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function getUser(req, res) {
  const { user } = res.locals;

  try {
    res.send(user);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}

export async function getUserById(req, res) {
  const id = parseInt(req.params.id);

  try {
    const userResult = await connection.query(
      `SELECT
        users.id, name, SUM("visitCount") AS "visitCount"
      FROM users
        LEFT JOIN urls ON users.id=urls."userId"
      WHERE users.id=$1
      GROUP BY users.id`,
      [id]
    );

    if (userResult.rowCount < 1) {
      return res.status(404).send("Não há usuário com esse ID");
    }

    const [{ id: userId, name, visitCount }] = userResult.rows;

    const urlsResult = await connection.query(
      `SELECT
        id, "shortUrl", url, "visitCount"
      FROM urls WHERE "userId"=$1`,
      [id]
    );

    const shortenedUrls = urlsResult.rows;

    res.status(200).send({
      id: userId,
      name,
      visitCount: visitCount ? visitCount : 0,
      shortenedUrls,
    });
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
}
