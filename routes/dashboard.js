import googleAuth from '../googlAuth.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const {doc, productsData} = await googleAuth();

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Multer with MemoryStorage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Retrieve Data from google Sheet
async function getData(sheetName) {
  await doc.loadInfo();
  const rows = await sheetName.getRows();
  return rows;
}

// Render home page with data
router.get('/', async (req, res) => {
  const rowss = await getData(productsData);
  const rows = rowss.reverse();
  res.render('dashboard', { rows });
})

// render add page
router.get('/add', (req, res) => {
  res.render('add');
})

// add data to google sheet
router.post('/add', upload.single('imgUrl'), async (req, res) => {
  try {
    let imgPublicId;
    if (req.file) {
      const cloudinaryResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            resolve(result);
          }
        }).end(req.file.buffer);
      });
      req.body.image = cloudinaryResponse.secure_url;
      imgPublicId = cloudinaryResponse.public_id;
    }

    await doc.loadInfo();
    const rows = await productsData.addRow({
      ...req.body,
      imgPublicId: imgPublicId,
    });
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error adding data and uploading image:', error);
    res.status(500).send('Internal Server Error');
  }
});

// render edit page
router.get('/edit/:id', async (req, res) => {
  const rows = await getData(productsData);
  const row = rows.find(row => row.get('id') == req.params.id)
  res.render('edit', { row });
})

// Route to update row values in Google Sheet
router.post('/edit/:id', upload.single('imgurl'), async (req, res) => {
  await doc.loadInfo();
  const rows = await productsData.getRows();
  rows.forEach(async row => {
    if (row.get('id') == req.params.id) {
      let imgPublicId;
      if (req.file && row.get('image') != req.body.image) {
        try {
          await cloudinary.uploader.destroy(row.get('imgPublicId'));
          const cloudinaryResponse = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image' }, (err, result) => {
              if (err) {
                console.log(err);
                reject(err);
              } else {
                resolve(result);
              }
            }).end(req.file.buffer);
          });
          req.body.image = cloudinaryResponse.secure_url;
          imgPublicId = cloudinaryResponse.public_id;
        } catch (error) {
          console.error('Error updating image URL on Cloudinary:', error);
          throw error;
        }
      }
      row.assign({
        ...req.body,
        imgPublicId: imgPublicId,
      });
      await row.save();
    }
  })
  res.redirect('/dashboard');
});

// delete data in google sheet
router.get('/delete/:id', async (req, res) => {
  await doc.loadInfo();
  const rows = await productsData.getRows();
  rows.forEach(async row => {
    if (row.get('id') == req.params.id) {
      let imgPublicId = row.get('imgPublicId')
      await row.delete();
      if (imgPublicId) {
        await cloudinary.uploader.destroy(imgPublicId);
      }
    }
    return;
  })
  // await row.delete();
  res.redirect('/dashboard');
})

export default router;