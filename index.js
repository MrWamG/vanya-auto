const axios = require('axios');

async function attackBoss(bossId = 2) {
  const url = 'https://vanyaonline.com/process/adventure_attack.php';
  
  const config = {
    headers: {
      'accept': '*/*',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,zh-TW;q=0.6',
      'content-type': 'application/json',
      'cookie': '__stripe_mid=f8def9f9-5dcd-4610-94fe-6bd22c9430273ee33e; PHPSESSID=sbsfer4c0kemmlp5o4g2j6342n',
      'origin': 'https://vanyaonline.com',
      'priority': 'u=1, i',
      'referer': `https://vanyaonline.com/adventure?boss_id=${bossId}`,
      'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'x-csrf-token': '2e79baa36ca94eb180d6c39dce8ee829ebb0a8b076e1cbb200aefec205cc4dbc'
    }
  };

  const data = {
    boss_id: bossId,
    recaptcha_token: ""
  };

  console.log(`正在攻击Boss ${bossId}...`);
  
  try {
    const response = await axios.post(url, data, config);
    
    console.log('响应状态:', response.status, response.statusText);
    console.log('响应数据:', response.data);
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('服务器错误:', error.response.status);
      console.error('错误数据:', error.response.data);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('无响应:', error.message);
    } else {
      // 请求配置错误
      console.error('请求错误:', error.message);
    }
    throw error;
  }
}

// 使用示例
attackBoss(2)
  .then(result => console.log('攻击完成!'))
  .catch(error => console.error('攻击失败:'));