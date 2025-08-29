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
  // 元映像、HSV変換後、マスク、最終結果を格納する「入れ物」を用意
  const src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
  const hsv = new cv.Mat(video.height, video.width, cv.CV_8UC3);
  const greenMask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
  const result = new cv.Mat(video.height, video.width, cv.CV_8UC4);

  function processVideo() {
    cap.read(src); // 1. カメラから映像を1フレーム読み込む

    // 2. 映像をHSV色空間に変換する
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    // 3. 緑色の範囲を定義し、その範囲に合う部分が「白」になるマスク画像を作成する
    const greenLower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [30, 40, 40, 0]);
    const greenUpper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [90, 255, 255, 255]);
    cv.inRange(hsv, greenLower, greenUpper, greenMask);

    // 4. 最終的な出力画像を作成する
    //    まず、結果用の画像を「真っ黒」で一度塗りつぶす
    result.setTo(new cv.Scalar(0, 0, 0, 255));
    //    次に、元の映像(src)から、マスク(greenMask)で白くなっている部分だけを、
    //    結果用の画像(result)にコピーする
    src.copyTo(result, greenMask);

    // 5. 完成した画像をCanvasに描画する
    cv.imshow('canvas_output', result);

    // 繰り返し処理を予約
    requestAnimationFrame(processVideo);

    // メモリ解放
    greenLower.delete();
    greenUpper.delete();
  }

  processVideo();
};