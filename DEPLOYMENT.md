# 🚀 部署到 GitHub Pages

## 方法 1: 替换现有 GitHub Pages 网站（推荐）

假设您的 GitHub Pages 仓库是 `hoder-zyf/hoder-zyf.github.io`

### 步骤：

1. **克隆您的现有仓库**（如果还没有）
```bash
cd ~
git clone https://github.com/hoder-zyf/hoder-zyf.github.io.git
cd hoder-zyf.github.io
```

2. **备份旧文件**（可选但推荐）
```bash
mkdir backup-old-site
mv * backup-old-site/
mv .* backup-old-site/ 2>/dev/null || true
```

3. **复制新网站文件**
```bash
# 复制所有文件
cp -r /data/userdata/v-zhangyifei/yifei/* .
cp -r /data/userdata/v-zhangyifei/yifei/.github . 2>/dev/null || true
```

4. **提交并推送**
```bash
git add .
git commit -m "Update personal website with new design"
git push origin main
# 如果是 master 分支，使用: git push origin master
```

5. **等待部署**
- 访问 https://github.com/hoder-zyf/hoder-zyf.github.io/actions
- 等待 GitHub Actions 完成部署（通常 1-2 分钟）
- 然后访问 https://hoder-zyf.github.io

---

## 方法 2: 创建新仓库

如果您想创建一个新的仓库：

1. **在 GitHub 创建新仓库**
   - 仓库名必须是：`您的用户名.github.io`
   - 例如：`hoder-zyf.github.io`
   - 设置为 Public

2. **初始化并推送**
```bash
cd /data/userdata/v-zhangyifei/yifei
git init
git add .
git commit -m "Initial commit: Personal website"
git branch -M main
git remote add origin https://github.com/您的用户名/您的用户名.github.io.git
git push -u origin main
```

3. **配置 GitHub Pages**
   - 进入仓库 Settings → Pages
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `main` 和 `/root`
   - 点击 Save

---

## 方法 3: 使用本项目提供的 GitHub Actions（最简单）

本项目已包含 `.github/workflows/deploy.yml`，会自动部署：

1. **推送到 GitHub**
```bash
cd /data/userdata/v-zhangyifei/yifei
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/您的用户名/您的用户名.github.io.git
git push -u origin main
```

2. **GitHub Actions 会自动**：
   - 检测到推送
   - 自动构建和部署
   - 部署到 GitHub Pages

3. **访问网站**
   - https://您的用户名.github.io

---

## 🔧 需要的文件清单

确保以下文件都在仓库中：

### 必需文件：
- ✅ `index.html` - 主页
- ✅ `publications.html` - Publications 页面
- ✅ `img/` - 所有图片文件
  - `nju.png` (favicon)
  - `msra.png` (MSRA logo)
  - `cuhksz.png` (CUHK logo)
  - `wechat.png` (WeChat QR code)
  - `pic_image.png` (个人头像)
  - `TwinMarket.jpg`
  - `UCFE.png`
  - `RDAgent.png`
  - `xiuqi.png`
  - `yxyz.jpg`
  - `finllava.png`

### 可选文件：
- `.github/workflows/deploy.yml` - 自动部署配置
- `404.html` - 404 错误页面
- `papers.bib` - Publications 数据（如果需要）

---

## 📝 快速命令（一键部署）

```bash
# 1. 进入项目目录
cd /data/userdata/v-zhangyifei/yifei

# 2. 初始化 git（如果还没有）
git init
git add .
git commit -m "Personal website: Initial commit"

# 3. 添加远程仓库（替换为您的仓库地址）
git remote add origin https://github.com/hoder-zyf/hoder-zyf.github.io.git

# 4. 推送到 GitHub
git branch -M main
git push -u origin main -f  # -f 强制推送（会覆盖远程仓库）
```

⚠️ **警告**：使用 `-f` 会覆盖远程仓库的所有内容，请确保已备份！

---

## 🌐 访问您的网站

部署完成后，您的网站将在以下地址可用：
- https://hoder-zyf.github.io （如果您的用户名是 hoder-zyf）

---

## 💡 提示

1. **首次部署可能需要几分钟**
2. **确保仓库是 Public**（Private 仓库需要 GitHub Pro）
3. **如果使用自定义域名**，需要在仓库根目录添加 `CNAME` 文件
4. **查看部署状态**：访问 `https://github.com/您的用户名/您的用户名.github.io/actions`

---

## 🆘 常见问题

### Q: 推送后网站没有更新？
A: 等待 1-2 分钟，清除浏览器缓存，强制刷新（Ctrl+Shift+R）

### Q: 404 错误？
A: 检查仓库名是否正确（必须是 `用户名.github.io`）

### Q: 图片不显示？
A: 检查图片路径大小写是否正确，GitHub Pages 区分大小写

### Q: CSS/JS 不加载？
A: 检查是否使用了绝对路径，应该使用相对路径

