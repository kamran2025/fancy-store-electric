import googleAuth from './googlAuth.js';
import { v2 as cloudinary } from 'cloudinary';
import express from 'express';
import ejs from 'ejs';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import userRoutes from './routes/user.js';
import dashboardRoutes from './routes/dashboard.js';
import { isAdmin, isCookie } from './middlewares/user.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.resolve("public")))
app.set('view engine', 'ejs');
app.set('views', path.resolve('./views'))

const { doc, productsData } = await googleAuth();

// /middlewares 
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

app.use(isCookie('token'))

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
  res.render('index', { products, user: req.user });
})

app.use('/user', userRoutes);
app.use('/dashboard', isAdmin, dashboardRoutes);

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
  res.render('search', { query, results, user: req.user });
})

// products page 
app.get('/products', async (req, res) => {
  const rowss = await getData(productsData);
  const products = rowss.reverse();
  res.render('products', { products, user: req.user });
})

// about page
app.get('/about', (req, res) => {
  res.render('about', {user: req.user});
})

// single product page
app.get('/:title/:id', async (req, res) => {
  const products = await getData(productsData);
  const product = products.find(product => product.get('id') == req.params.id);
  res.render('product', { product, products, user: req.user });
})

// 404 page
app.get('*', (req, res) => {
  res.render('404');
})

// how to listen 
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})

