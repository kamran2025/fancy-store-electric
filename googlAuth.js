import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
dotenv.config();

async function googleAuth() {
  try {

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
    
    return { doc, productsData, userData };
  } catch (error) {
    console.error('Error in Google Auth:', error);
    throw error; 
  }
  
}

export default googleAuth;