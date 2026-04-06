const client = new WOLF();

// ============================
// TWITTER AUTH
// ============================
const TWITTER_CREDS_FILE = path.join(__dirname, 'twitter-credentials.json');

function loadTwitterCreds() {
  if (!fs.existsSync(TWITTER_CREDS_FILE)) {
    throw new Error('❌ ملف twitter-credentials.json غير موجود!');
  }
  return JSON.parse(fs.readFileSync(TWITTER_CREDS_FILE, 'utf8'));
}

async function tryLogin(username, password, type) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve({ success: false, reason: 'timeout' });
    }, 20000);

    client.once('ready', () => {
      clearTimeout(timer);
      resolve({ success: true });
    });

    client.once('loginFailed', (err) => {
      clearTimeout(timer);
      const code = err?.headers?.code || err?.code || 'unknown';
      const msg  = err?.headers?.message || err?.message || '';
      resolve({ success: false, reason: `loginFailed`, code, msg, full: JSON.stringify(err) });
    });

    client.login(username, password, undefined, 1, type).catch(err => {
      clearTimeout(timer);
      resolve({ success: false, reason: err.message });
    });
  });
}

async function loginWithTwitter() {
  const creds    = loadTwitterCreds();
  const userId   = creds.user_id || creds.access_token.split('-')[0];
  const accToken = creds.access_token;
  const secret   = creds.access_token_secret;

  console.log('🔑 بدء محاولات تسجيل الدخول...\n');

  // اعتراض كل الرسائل الواردة من Wolf Live
  client.on('packetReceived', (event, data) => {
    console.log(`📦 Wolf Live → ${event}:`, JSON.stringify(data)?.substring(0, 200));
  });

  const twitterUserId = userId;
  const twitterToken  = accToken;
  const twitterSecret = secret;

  // جرب جميع التنسيقات الممكنة مع التأخير بين كل محاولة
  // Google OAuth tokens (حديثة من OAuth Playground)
  const googleAccessToken = 'ya29.a0Aa7MYiqn06XoO0HG8Vs7GYLl5ayEHlpBnIJs_GQQNYIoqzn891Et6DA1HNBzFSLdA9njHfGtr76GzmlD3QPSQWLhE6m3V7dwcdv_PS6rHIDxBdhYlC5T7XSnd__B-deWCPeoTFY7JXjfaqx1Q5Dgna82HevKOTnir7adxf_et4W_SlECKd3hW6wbBsZr02eSunsAVSsaCgYKAV4SARMSFQHGX2MireIJpMNyTy7RUiMfvEQFJA0206';
  const googleIdToken   = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImNjZTRlMDI0YTUxYWEwYzFjNDFjMWE0NTE1YTQxZGQ3ZTk2MTkzNmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDc0MDg3MTgxOTIuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDk1MDMyNDI5NTcyNDc3OTg1NjgiLCJlbWFpbCI6InguejNsLmtpbmdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJNdG1nZUw0dDI0dUVjbTFOSGlvV0dnIiwibmFtZSI6InlhaHlhIHgiLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUNnOG9jSnBYem15VjhMMGpiQWwxeWEwZDRwMHhlYU93a2RhUlpTalVRbkFFQ1NZdW9TZ1NnPXM5Ni1jIiwiZ2l2ZW5fbmFtZSI6InlhaHlhIiwiZmFtaWx5X25hbWUiOiJ4IiwiaWF0IjoxNzc1NDMzMTE4LCJleHAiOjE3NzU0MzY3MTh9.JbddsCe-SvEXXXo8qDqE1vVH1s76i3sv6yXv6OrQSw3ykVeJpNbLL1A-hti-hpudX2aHPBwhahAJuBClSsukfYF2e0it7uV7_tEf9M5PI7YO_k2ewHUzVAbtGF2E5aTJgF0SljsbSpGdevxIxDyvlYvKvpGY9T59aMpgIVBqVyRRCqOrWf7gRee40fWItZ9OlQeIs8Q3OnQt7gOu9vcBGmssmrX5XRkpVxj-kLM2rM1rZW8fXqarXm4pXpGfeUDboBJTjQtjBnjPbS7r3T5nh5RvBQo4PZO1koJRWb9hb8IemDLscg_I-daTGxa9oDEPgy_5x_RqGpQxDRr0hNCdRw';
  const googleUserId    = '109503242957247798568'; // sub from id_token JWT
  const googleEmail     = 'x.z3l.king@gmail.com';

  const formats = [
    // ⭐ أفضل محاولات Google (حصلنا على 400 = Wolf Live يحاول معالجتها)
    { u: googleEmail,  p: googleAccessToken, type: 'google', label: '⭐ google: email + accessToken' },
    { u: googleEmail,  p: googleIdToken,     type: 'google', label: '⭐ google: email + idToken (JWT)' },
    { u: googleUserId, p: googleAccessToken, type: 'google', label: '⭐ google: userId + accessToken' },
    { u: googleUserId, p: googleIdToken,     type: 'google', label: '⭐ google: userId + idToken' },
    // Twitter fallbacks
    { u: twitterToken,  p: twitterSecret, type: 'twitter', label: 'twitter: accessToken + tokenSecret' },
    { u: twitterUserId, p: twitterToken,  type: 'twitter', label: 'twitter: userId + accessToken' },
  ];

  let round = 0;
  while (true) {
    round++;
    console.log(`\n━━━━ جولة #${round} ━━━━`);

    for (const fmt of formats) {
      console.log(`\n🔄 جرب: ${fmt.label}`);
      const result = await tryLogin(fmt.u, fmt.p, fmt.type);
      console.log(`   النتيجة: code=${result.code || ''} reason=${result.reason}`);

      if (result.success) {
        console.log(`\n✅✅✅ نجح: ${fmt.label}`);
        return;
      }

      if (result.reason === 'loginFailed') {
        const code = result.code;
        if (code === 401 || code === 403) {
          console.log(`   ❌ رُفض (${code}) - بيانات خاطئة أو حساب غير موجود`);
        } else if (code === 429) {
          console.log(`   ⏳ معدل تجاوز (429) - انتظر 3 دقائق...`);
          await new Promise(r => setTimeout(r, 180000));
        } else {
          console.log(`   ⚠️ كود ${code}`);
        }
      } else if (result.reason === 'timeout') {
        console.log(`   ⏱️ Wolf Live لم يرد - تنسيق غير معروف`);
      }

      // تأخير 10 ثوان بين كل محاولة
      await new Promise(r => setTimeout(r, 10000));
    }

    console.log(`\n⏳ انتهت جولة #${round}، انتظر 5 دقائق قبل الجولة القادمة...`);
    await new Promise(r => setTimeout(r, 300000));
  }
}
