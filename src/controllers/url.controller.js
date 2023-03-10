import { nanoid } from "nanoid";
import { db } from "../database/database.js";

export async function shortenUrl(req, res) {
  const { url } = req.body;

  try {
    const session = res.locals.session;
    console.log(session);
    const shortUrl = nanoid(8);

    await db.query(
      `INSERT INTO urls (url, "shortUrl", "userId") 
      VALUES ($1,$2,$3);`,
      [url, shortUrl, session.rows[0].userId]
    );

    const shortUrlwithId = await db.query(
      `SELECT id, "shortUrl" FROM urls WHERE "shortUrl"=$1;`,
      [shortUrl]
    );

    res.status(201).send(shortUrlwithId.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
}

export async function getUrlDetails(req, res) {
  try {
    const { id } = req.params;
    const Url = await db.query(
      `
        SELECT id, "shortUrl", url 
        FROM urls WHERE id=$1`,
      [id]
    );
    if (Url.rowCount === 0) {
      res.sendStatus(404);
    }
    res.status(200).send(Url.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
    return;
  }
}

export async function getShortenedUrl(req, res) {
  const { shortUrl } = req.params;
  console.log(shortUrl);
  try {
    const shUrl = await db.query(
      `
    SELECT *
    FROM urls 
    WHERE "shortUrl"=$1`,
      [shortUrl]
    );
    console.log(shUrl);
    if (shUrl.rowCount === 0) {
      return res.sendStatus(404);
    }
    await db.query(
      `
    UPDATE urls 
    SET "viewCount" = $1
    WHERE id=$2`,
      [shUrl.rows[0].viewCount + 1, shUrl.rows[0].id]
    );
    res.redirect(shUrl.rows[0].url);
  } catch (err) {
    res.status(500).send(err.message);
    return;
  }
}

export async function deleteUrl(req, res) {
  const { id } = req.params;
  console.log(id);
  const session  = res.locals.session;
  console.log(session);

  try {
    const Search = await db.query(`SELECT * from urls WHERE id=$1`, [id]);
    if (Search.rowCount === 0) {
      return res.sendStatus(404);
    }

    if (Search.rows[0].userId !== session.rows[0].userId) {
      return res.sendStatus(401);
    }

    await db.query(`DELETE FROM urls WHERE id =$1;`, [id]);
    res.sendStatus(204);
  } catch (err) {
    res.status(500).send(err.message);
    return;
  }
}
