// ==UserScript==
// @name         Vanya Online 自动花费金币购买体力
// @namespace    http://tampermonkey.net/
// @version      0.0.5
// @description  网页游戏 Vanya Online (https://vanyaonline.com/) 的自动化脚本
// @author       王铁牛(QQ: 2459120212)
// @icon         https://vanyaonline.com/favicon.ico
// @license      MIT
// @include      *https://vanyaonline.com/*
// @grant        none
// ==/UserScript==

// 抓取 https://vanyaonline.com/actions/hunt 中剩余的生命值
const catchLife = async () => {
    const limit = 300; // 低于该值则购买一次体力
    let life = "9999";
    if(window.location.pathname === "/actions/hunt"){
        life = document.getElementById("lifeSpan").innerHTML
        // 如果生命值小于阈值（limit）则直接购买体力（不需要去酒馆，我直接调用接口）
        if(life <= limit) {
            try {
                await fetch(
                    "https://vanyaonline.com/process/pub_npc_buy.php",
                    {
                        method: "POST",
                        headers: {
                            accept: "*/*",
                            "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,zh-TW;q=0.6",
                            "content-type": "application/x-www-form-urlencoded",
                            cookie: document.cookie,
                            origin: "https://vanyaonline.com",
                            priority: "u=1, i",
                            referer: "https://vanyaonline.com/pub",
                            "sec-ch-ua": `"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"`,
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": '"Windows"',
                            "sec-fetch-dest": "empty",
                            "sec-fetch-mode": "cors",
                            "sec-fetch-site": "same-origin",
                            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
                        },
                        body: "item_id=3", // 请求体
                        credentials: "include", // 相当于 axios 的 withCredentials: true
                    }
                );
                
            } catch (error) {
                console.error("Error:", error.message);
            }
        }
    }
};

// 每三秒检测一次
setInterval(async () => {
    await catchLife();
},1000 * 3)