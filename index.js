import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import express from 'express';
import ejs from 'ejs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'))

const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

const doc = new GoogleSpreadsheet(process.env.SPEADSHEET_ID, serviceAccountAuth);
await doc.loadInfo();
const sheet = doc.sheetsByIndex[0];

// /middlewares 
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(express.static("public"))

// Retrieve Data from google Sheet
async function getData() {
  await doc.loadInfo();
  const rows = await sheet.getRows();
  return rows;
}

// Render home page with data
app.get('/', async (req, res) => {
  const rowss = await getData();
  const rows = rowss.reverse();
  res.render('index', { rows });
})

// render add page
app.get('/add', (req, res) => {
  res.render('add');
})

// add data to google sheet
app.post('/add', async (req, res) => {
  await doc.loadInfo();
  const rows = await sheet.addRow(req.body);
  res.redirect('/');
})

// render edit page
app.get('/edit/:id', async (req, res) => {
  const rows = await getData();
  const row = rows.find(row => row.get('id') == req.params.id)
  res.render('edit', { row });
})

// Route to update row values in Google Sheet
app.post('/edit/:id', async (req, res) => {
  await doc.loadInfo();
  const rows = await sheet.getRows();
  rows.forEach(async row => {
    if (row.get('id') == req.params.id) {
      row.assign(req.body);
      await row.save();
    }
    })
  res.redirect('/');
});

// delete data in google sheet
app.get('/delete/:id', async (req, res) => {
  await doc.loadInfo();
  const rows = await sheet.getRows();
  rows.forEach(async row => {
    if (row.get('id') == req.params.id) {
      await row.delete();
    }
    return;
  })
  // await row.delete();
  res.redirect('/');
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})



