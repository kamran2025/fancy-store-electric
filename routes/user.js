import googleAuth from '../googlAuth.js';
import express from 'express';
import { createHmac, randomBytes } from 'crypto'


import { getUserByEmailAndPasswordWithToken } from '../controllers/auth.js'

const router = express.Router();

const { doc, userData } = await googleAuth();


router.get('/signup', (req, res) => {
  res.render('signup');
})

router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {

    const salt = randomBytes(16).toString();
    const hashedPassword = createHmac('sha256', salt)
      .update(password)
      .digest('hex');

    const allUsers = await userData.getRows();
    const userWithEmailExists = allUsers.some(user => user.get('email') === email);
    if (userWithEmailExists) {
      return res.status(409).send('Email already exists');
    }

    const role = "USER";
    await doc.loadInfo();
    await userData.addRow({
      name,
      email,
      password: hashedPassword,
      role,
      salt,
    });

    res.redirect('/user/login');
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/login', async (req, res) => {
  res.render('login');
});

// Route for handling login form submission
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {

    const token = await getUserByEmailAndPasswordWithToken(email, password);
    if (!token) {
      return res.render('login', {
        error: 'Incorrect Email and Password'
      })
    }

    return res.cookie("token", token).redirect('/');
    
  } catch (error) {
    return res.render('login', {
      error: 'Incorrect Email and Password'
    })
  }
});

router.get('/logout', (req, res) => {
  res.clearCookie('token').redirect('/');
})

export default router;