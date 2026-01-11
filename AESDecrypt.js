async function AESDecrypt(cipher, password) {
  let parts = cipher.split("|");
  let ciphertext = parts[1];
  let nonce = parts[0];
  const ciphertextBuffer = hexToBytes(ciphertext);

  // 计算密码的 SHA-256作为密钥
  let encoder = new TextEncoder();
  let data = encoder.encode(password);
  let hashBuffer = await crypto.subtle.digest("SHA-256", data);
  let hash = Array.from(new Uint8Array(hashBuffer));
  const hashKey = new Uint8Array(hash);

  const key = await window.crypto.subtle.importKey(
    "raw",
    hashKey,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  let iv = hexToBytes(nonce);
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
      tagLength: 128,
    },
    key,
    new Uint8Array(ciphertextBuffer)
  );

  return new TextDecoder("utf-8").decode(new Uint8Array(decrypted));
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
let title = document.title;

// 页面加载时，尝试用存储的密码解密所有加密块
document.addEventListener("DOMContentLoaded", function () {
  if (localStorage.getItem(title) !== null) {
    const savedPassword = localStorage.getItem(title);
    document
      .querySelectorAll(".verification-container")
      .forEach((container) => {
        decryption(savedPassword, container);
      });
  }

  // 为所有表单绑定提交事件
  document.querySelectorAll(".password-form").forEach((form) => {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      checkPassword(event);
    });
  });
});

function checkPassword(event) {
  // 从表单找到父容器
  const container = event.target.closest(".verification-container");
  const passwordInput = container.querySelector('input[name="password"]');
  const password = passwordInput.value;
  decryption(password, container);
}

function decryption(password, container) {
  let secretElement = container.querySelector(".secret");
  // 关键修复：确保获取的是当前容器内的密文
  let ciphertext = secretElement.textContent.trim();

  // 如果已经解密过（容器已隐藏），跳过
  if (container.style.display === "none") {
    return;
  }

  AESDecrypt(ciphertext, password)
    .then((plaintext) => {
      container.style.display = "none";

      marked.setOptions({
        breaks: true,
        gfm: true,
        sanitize: false,
        pedantic: false,
      });

      let htmlText = marked.parse(plaintext);

      container.insertAdjacentHTML("afterend", htmlText);

      if (localStorage.getItem(title) !== password) {
        localStorage.setItem(title, password);
      }
    })
    .catch((error) => {
      alert("Incorrect password. Please try again.");
      console.error("Failed to decrypt", error);
    });
}
