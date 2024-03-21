import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { v2 as cloudinary } from 'cloudinary';
import express from 'express';
import ejs from 'ejs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.resolve("public")))
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
const productsData = doc.sheetsByIndex[0];
const userData = doc.sheetsByIndex[1];

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// /middlewares 
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// Retrieve Data from google Sheet
async function getData(sheetName) {
  await doc.loadInfo();
  const rows = await sheetName.getRows();
  return rows;
}

// render home page
app.get('/', async (req, res) => {
  const rowss = await getData(productsData);
  const products = rowss.reverse();
  res.render('index', { products });
})

app.use('/dashboard', dashboardRouter);

// search page 
app.post('/search', async (req, res) => {
  const query = req.body.query;
  res.redirect(`/search-results?query=${encodeURIComponent(query)}`);
});

app.get('/search-results', async (req, res) => {
  const products = await getData(productsData);
  const query = req.query.query;
  const results = products.filter(product => product.get('title').toLowerCase().includes(query.toLowerCase()) || product.get('category').toLowerCase().includes(query.toLowerCase()) || product.get('price').toLowerCase().includes(query.toLowerCase()) || product.get('description').toLowerCase().includes(query.toLowerCase()));
  if (results.length === 0) return res.redirect('404')
  res.render('search', { query, results });
})

// products page 
app.get('/products', async (req, res) => {
  const rowss = await getData(productsData);
  const products = rowss.reverse();
  res.render('products', { products });
})

// about page
app.get('/about', (req, res) => {
  res.render('about');
})

// single product page
app.get('/:title/:id', async (req, res) => {
  const products = await getData(productsData);
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

