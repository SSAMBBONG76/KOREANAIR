const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 좋아요 저장 파일
const likesFile = path.join(__dirname, 'likes.json');
let likes = {};
if (fs.existsSync(likesFile)) {
  likes = JSON.parse(fs.readFileSync(likesFile));
}

// 업로드 디렉토리 없으면 생성
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 이미지 업로드
app.post('/upload', upload.single('image'), (req, res) => {
  const filename = req.file.filename;
  if (!(filename in likes)) {
    likes[filename] = 0;
    fs.writeFileSync(likesFile, JSON.stringify(likes, null, 2));
  }
  res.json({ path: `/uploads/${filename}` });
});

// 좋아요 처리 API
app.post('/like', (req, res) => {
  const { image, action } = req.body;
  if (!image || !['like', 'unlike'].includes(action)) {
    return res.status(400).json({ success: false, error: 'Invalid input' });
  }

  if (!(image in likes)) likes[image] = 0;
  if (action === 'like') likes[image]++;
  else if (action === 'unlike' && likes[image] > 0) likes[image]--;

  fs.writeFileSync(likesFile, JSON.stringify(likes, null, 2));
  res.json({ success: true, likes: likes[image] });
});

// 이미지 목록 반환
app.get('/images', (req, res) => {
  const sampleDir = path.join(__dirname, 'public/images');
  const uploadsDir = path.join(__dirname, 'uploads');

  let sampleImages = [];
  if (fs.existsSync(sampleDir)) {
    sampleImages = fs.readdirSync(sampleDir)
      .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
      .map(file => ({
        url: `/images/${file}`,
        likes: likes[file] || 0
      }));
  }

  let uploadedImages = [];
  if (fs.existsSync(uploadsDir)) {
    uploadedImages = fs.readdirSync(uploadsDir)
      .filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i))
      .map(file => ({
        url: `/uploads/${file}`,
        likes: likes[file] || 0
      }));
  }

  const allImages = [...sampleImages, ...uploadedImages];
  allImages.sort((a, b) => b.likes - a.likes); // 좋아요 높은 순

  res.json(allImages);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
