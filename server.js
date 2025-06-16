const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// 정적 폴더 설정
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 업로드 디렉토리 확인
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// 이미지 업로드
app.post('/upload', upload.single('image'), (req, res) => {
  res.json({ path: `/uploads/${req.file.filename}` });
});

// 이미지 목록 요청 (기본 + 업로드 이미지)
app.get('/images', (req, res) => {
  const sampleDir = path.join(__dirname, 'public/images');
  const uploadsDir = path.join(__dirname, 'uploads');

  let sampleImages = [];
  if (fs.existsSync(sampleDir)) {
    sampleImages = fs.readdirSync(sampleDir).filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i)).map(file => ({
      url: `/images/${file}`,
      likes: Math.floor(Math.random() * 1000) + 200
    }));
  }

  let uploadedImages = [];
  if (fs.existsSync(uploadsDir)) {
    uploadedImages = fs.readdirSync(uploadsDir).filter(file => file.match(/\.(jpg|jpeg|png|gif)$/i)).map(file => ({
      url: `/uploads/${file}`,
      likes: 0
    }));
  }

  const allImages = [...sampleImages, ...uploadedImages];
  allImages.sort((a, b) => b.likes - a.likes); // 좋아요 많은 순 정렬

  res.json(allImages);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
