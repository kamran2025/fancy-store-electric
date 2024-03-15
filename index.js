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

// render home page
app.get('/', async (req, res) => {
  const rowss = await getData();
  const products = rowss.reverse();
  res.render('index', { products });
})

// search page 
app.post('/search',async (req, res) => {
  const query = req.body.query; 
  res.redirect(`/search-results?query=${encodeURIComponent(query)}`);
});

app.get('/search-results', async (req, res) => {
  const products = await getData();
  const query = req.query.query;
  const results = products.filter(product => product.get('title').toLowerCase().includes(query.toLowerCase()) || product.get('category').toLowerCase().includes(query.toLowerCase()) || product.get('price').toLowerCase().includes(query.toLowerCase()) || product.get('description').toLowerCase().includes(query.toLowerCase()));
  if(results.length === 0) return res.redirect('404')
  res.render('search', { query, results });
})

// Render home page with data
app.get('/dashboard', async (req, res) => {
  const rowss = await getData();
  const rows = rowss.reverse();
  res.render('dashboard', { rows });
})

// render add page
app.get('/dashboard/add', (req, res) => {
  res.render('add');
})

// add data to google sheet
app.post('/dashboard/add', async (req, res) => {
  await doc.loadInfo();
  const rows = await sheet.addRow(req.body);
  res.redirect('/dashboard');
})

// render edit page
app.get('/dashboard/edit/:id', async (req, res) => {
  const rows = await getData();
  const row = rows.find(row => row.get('id') == req.params.id)
  res.render('edit', { row });
})

// Route to update row values in Google Sheet
app.post('/dashboard/edit/:id', async (req, res) => {
  await doc.loadInfo();
  const rows = await sheet.getRows();
  rows.forEach(async row => {
    if (row.get('id') == req.params.id) {
      row.assign(req.body);
      await row.save();
    }
    })
  res.redirect('/dashboard');
});

// delete data in google sheet
app.get('/dashboard/delete/:id', async (req, res) => {
  await doc.loadInfo();
  const rows = await sheet.getRows();
  rows.forEach(async row => {
    if (row.get('id') == req.params.id) {
      await row.delete();
    }
    return;
  })
  // await row.delete();
  res.redirect('/dashboard');
})

// products page 
app.get('/products', async (req, res) => {
  const rowss = await getData();
  const products = rowss.reverse();
  res.render('products', {products});
})

// about page
app.get('/about', (req, res) => {
  res.render('about');
})

// single product page
app.get('/:title/:id', async (req, res) => {
  const products = await getData();
  const product = products.find(product => product.get('id') == req.params.id);
  res.render('product', { product, products });
})

// 404 page
app.get('*', (req, res) => {
  res.render('404');
})

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})

