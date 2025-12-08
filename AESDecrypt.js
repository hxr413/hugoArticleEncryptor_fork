async function AESDecrypt(cipher, password) {
    let parts = cipher.split("|");
    let ciphertext = parts[1];
    let nonce = parts[0];
    const ciphertextBuffer = hexToBytes(ciphertext)
    
    // 计算密码的 SHA-256作为密钥
    let encoder = new TextEncoder();
    let data = encoder.encode(password);
    let hashBuffer = await crypto.subtle.digest('SHA-256', data);
    let hash = Array.from(new Uint8Array(hashBuffer));
    const hashKey = new Uint8Array(hash);
    
    const key = await window.crypto.subtle.importKey(
        'raw',
        hashKey, 
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    )
    
    let iv = hexToBytes(nonce)
    const decrypted = await window.crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
    },
        key,
        new Uint8Array(ciphertextBuffer)
    )
    
    return new TextDecoder('utf-8').decode(new Uint8Array(decrypted))
}

function hexToBytes(hexString) {
    // 去除可能存在的前缀 "0x" 或 "0X"
    if (hexString.startsWith("0x") || hexString.startsWith("0X")) {
        hexString = hexString.slice(2);
    }
    
    // 将十六进制字符串转换为 Uint8Array
    const bytes = new Uint8Array(hexString.length / 2);
    for (let i = 0; i < hexString.length; i += 2) {
        bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
    }
    return bytes;
}

console.log("js load");
let title = document.title

if (localStorage.getItem(title) !== null) {
    decryption(localStorage.getItem(title))
}

const submitButton = document.getElementById('secret-submit');
submitButton.addEventListener('click', function (event) {
    event.preventDefault();
    checkPassword();
});

function checkPassword() {
    const passwordInput = document.querySelector('input[name="password"]');
    const password = passwordInput.value;
    decryption(password)
}

function decryption(password) {
    let secretElement = document.getElementById('secret');
    // 关键修复：使用 textContent 而不是 innerText
    let ciphertext = secretElement.textContent.trim();
    
    AESDecrypt(ciphertext, password).then(plaintext => {
        document.getElementById("verification").style.display = "none";
        let verificationElement = document.getElementById('verification');
        
        // 智能判断内容类型
        let htmlText;
        const trimmedPlaintext = plaintext.trim();
        
        // 如果内容以 HTML 标签开始，直接作为 HTML 插入
        if (trimmedPlaintext.startsWith('<')) {
            htmlText = plaintext;
        } 
        // 否则作为 Markdown 解析
        else {
            htmlText = marked.parse(plaintext);
        }
        
        verificationElement.insertAdjacentHTML('afterend', htmlText);
        
        if (localStorage.getItem(title) !== password) {
            localStorage.setItem(title, password);
        }
    }).catch(error => {
        alert("Incorrect password. Please try again.");
        console.error("Failed to decrypt", error);
    });
}