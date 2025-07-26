const axios = require("axios");

const getTokensFromGoogle = async (code) => {
  const response = await axios.post(
    "https://oauth2.googleapis.com/token",
    null,
    {
      params: {
        code,
        client_id: process.env.CLIENT_ID_GOOGLE,
        client_secret: process.env.CLIENT_SECRET_GOOGLE,
        redirect_uri: process.env.COME_BACK_LINK, // لازم يطابق اللي سجلتيه في Google Console
        grant_type: "authorization_code",
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data; // بيحتوي على access_token و id_token
};

module.exports = getTokensFromGoogle;
