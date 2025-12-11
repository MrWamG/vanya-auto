// ==UserScript==
// @name         Vanya Online 自动花费金币购买体力
// @namespace    http://tampermonkey.net/
// @version      0.0.8
// @description  网页游戏 Vanya Online (https://vanyaonline.com/) 的自动化脚本
// @author       王铁牛(QQ: 2459120212)
// @icon         https://vanyaonline.com/favicon.ico
// @license      MIT
// @include      *https://vanyaonline.com/*
// @grant        none
// ==/UserScript==

const parseTimeString = (timeStr) => {
    // 将字符串分割为时、分、秒部分
    const parts = timeStr.split(/\s*,\s*/);
    let totalSeconds = 0;

    parts.forEach(part => {
        if (part.endsWith('h')) {
            totalSeconds += parseInt(part) * 3600;
        } else if (part.endsWith('m')) {
            totalSeconds += parseInt(part) * 60;
        } else if (part.endsWith('s')) {
            totalSeconds += parseInt(part);
        }
    });

    return totalSeconds;
}


// 终止狩猎（狩猎时间即将超过 12 小时或没钱买血时执行）
const huntStop = async () => {
    // 请求的 http code 为 304 是正常情况
    await fetch('https://vanyaonline.com/actions/hunt_stop', {
        method: 'POST',
        headers: {
            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,zh-TW;q=0.6',
            'cache-control': 'max-age=0',
            'content-type': 'application/x-www-form-urlencoded',
            'origin': 'https://vanyaonline.com',
            'priority': 'u=0, i',
            'referer': 'https://vanyaonline.com/actions/hunt',
            'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'document',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-user': '?1',
            'upgrade-insecure-requests': '1',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
        },
        body: `action=stop_hunt&csrf_token=${globalCsrfToken}`,
        credentials: 'include'  // 这会让浏览器自动发送 cookies
    })
}

// 监听狩猎时间是否已经大于 11 小时 30 分，是的话则终止本轮狩猎，开始准备下一轮狩猎
const isTimeEnd = async () => {
    if (window.location.pathname === "/actions/hunt") {
        /* 格式是 1h,12m,30s */
        const huntTime = document.getElementById("time-elapsed").innerHTML;
        // 11小时30分钟的秒数
        const threshold = 11 * 3600 + 30 * 60; // 41400秒
        // 如果当前狩猎时间大于 11 小时 30 分钟则终止狩猎，然后开始下一轮狩猎
        if (parseTimeString(huntTime) > threshold) {
            await huntStop();
            setTimeout(() => {
                // 进入狩猎列表
                window.location = "https://vanyaonline.com/actions/explore";
            }, 300)
        }
    }

    // 进入了狩猎列表，开始找自己最高能打的本
    if (window.location.pathname === "/actions/explore") {
        const huntButtons = document.querySelectorAll('button[type*="submit"]');
        huntButtons[huntButtons.length - 1].click();
    }
}

// 抓取 https://vanyaonline.com/actions/hunt 中剩余的生命值
const catchLife = async () => {
    const limit = 950; // 低于该值则购买一次体力
    let life = "9999";
    if (window.location.pathname === "/actions/hunt") {
        life = document.getElementById("lifeSpan").innerHTML
        // 如果生命值小于阈值（limit）则直接购买体力（不需要去酒馆，我直接调用接口）
        if (life <= limit) {
            const url = 'https://vanyaonline.com/process/pub_npc_buy.php';

            // 设置请求头
            const headers = {
                'accept': '*/*',
                'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,zh-TW;q=0.6',
                'content-type': 'application/x-www-form-urlencoded',
                'origin': 'https://vanyaonline.com',
                'priority': 'u=1, i',
                'referer': 'https://vanyaonline.com/pub',
                'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
            };

            // 设置请求体
            const body = 'item_id=3';

            // 设置凭证模式（cookies会自动携带）
            const credentials = 'include'; // 相当于 curl 的 -b 参数

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: body,
                    credentials: credentials,
                    mode: 'cors'  // 设置 CORS 模式
                });

                const data = await response.json();
                console.log({ data });

                // 如果购买生命值没成功则终止狩猎
                if (data.status === "error") {
                    await huntStop();
                    // 直接跳转至酒馆界面
                    window.location = "https://vanyaonline.com/pub";
                }

            } catch (error) {
                console.error('请求失败:', error);
                throw error;
            }
        }
    }
};

// 停止离线训练（如果买血的金币不够会自动开始酒馆的防御自动点击训练，但点击训练与离线训练冲突，因此需要将离线训练终止）
const stopOfflineTraining = async () => {
    const url = 'https://vanyaonline.com/process/pub_offline_train.php';

    // 设置请求头
    const headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,zh-TW;q=0.6',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://vanyaonline.com',
        'priority': 'u=1, i',
        'referer': 'https://vanyaonline.com/pub',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    };

    // 设置请求体
    const body = 'action=stop';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body,
            credentials: 'include',  // 包含 cookies
            mode: 'cors',
            cache: 'no-cache'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('停止离线训练响应:', data);
        return data;

    } catch (error) {
        console.error('停止离线训练失败:', error);
        throw error;
    }
}

// 开始训练
const trainingClick = async () => {
    if (window.location.pathname !== "/pub") {
        return false;
    };
    const url = 'https://vanyaonline.com/process/pub_train_click.php';

    // 设置请求头
    const headers = {
        'accept': '*/*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,ja;q=0.7,zh-TW;q=0.6',
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://vanyaonline.com',
        'priority': 'u=1, i',
        'referer': 'https://vanyaonline.com/pub',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
    };

    // 注意：dummy_id=NaN 是字符串 "NaN"，不是 JavaScript 的 NaN
    const body = 'dummy_id=NaN&skill=defense&start=0&is_lite=0';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body,
            credentials: 'include',
            mode: 'cors',
            cache: 'no-cache',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // 如果主动训练失败，极有可能是目前正处于离线训练，将离线训练终止
        if(data.status === "error"){
            await stopOfflineTraining();
        }
        console.log('训练角色响应:', data);
        return data;

    } catch (error) {
        console.error('训练角色失败:', error);
        throw error;
    }
}

// 每一点五秒执行
setInterval(async () => {
    await trainingClick();
}, 1000 * 1.5)

// 每三秒检测一次
setInterval(async () => {
    await isTimeEnd();
    await catchLife();
}, 1000 * 3)

// 游戏在刷怪界面是每过 1 分钟刷新一次页面以更新数据，为了避免发生意外情况（如果游戏维护）导致游戏不刷新内容，故我方每 1分10秒 刷新一次页面
setInterval(async () => {
    if (window.location.pathname === "/actions/hunt") {
        location.reload();
    };
}, 1000 * 70)