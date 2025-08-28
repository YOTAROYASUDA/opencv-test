const video = document.getElementById('cam_input');
const canvasOutput = document.getElementById('canvas_output');

navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.play();
  })
  .catch(err => console.error("カメラ取得エラー:", err));

cv['onRuntimeInitialized'] = () => {
  console.log("✅ OpenCV.js ready!");

  const cap = new cv.VideoCapture(video);
  const src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  const gray = new cv.Mat(video.height, video.width, cv.CV_8UC1);

  function processVideo() {
    cap.read(src);                                // フレーム読み取り
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);   // グレースケール変換
    cv.imshow('canvas_output', gray);             // Canvasに描画

    requestAnimationFrame(processVideo);          // 次フレーム処理
  }

  processVideo();
};
