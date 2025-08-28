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
  const hsv = new cv.Mat(video.height, video.width, cv.CV_8UC3);
  const greenMask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
  const anomalyMask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
  const hierarchy = new cv.Mat();

  function processVideo() {
    cap.read(src); // フレーム読み取り

    // 1. HSV色空間に変換
    cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

    // 2. 健康な葉（緑色）の範囲を定義してマスクを作成
    // 色相(H), 彩度(S), 明度(V)
    const greenLower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [30, 40, 40, 0]);
    const greenUpper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [90, 255, 255, 255]);
    cv.inRange(hsv, greenLower, greenUpper, greenMask);

    // 3. 異常な可能性のある部分（黄〜茶色）の範囲を定義してマスクを作成
    const anomalyLower = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [10, 100, 100, 0]);
    const anomalyUpper = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [30, 255, 255, 255]);
    cv.inRange(hsv, anomalyLower, anomalyUpper, anomalyMask);

    // 4. 葉の上にある異常部分だけを抽出
    const finalMask = new cv.Mat();
    cv.bitwise_and(greenMask, anomalyMask, finalMask);

    // 5. 異常部分の輪郭を見つけて四角で囲む
    const contours = new cv.MatVector();
    cv.findContours(finalMask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    for (let i = 0; i < contours.size(); ++i) {
      const cnt = contours.get(i);
      // 小さすぎる領域は無視
      if (cv.contourArea(cnt) > 50) {
        const rect = cv.boundingRect(cnt);
        // 左上の点
        const point1 = new cv.Point(rect.x, rect.y);
        // 右下の点
        const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
        const color = new cv.Scalar(255, 0, 0, 255); // 赤色で囲む
        // point1とpoint2を使って四角を描画する
        cv.rectangle(src, point1, point2, color, 2, cv.LINE_AA, 0);        
      }
      cnt.delete();
    }

    // 結果をCanvasに描画
    cv.imshow('canvas_output', src);

    // 次フレーム処理
    requestAnimationFrame(processVideo);

    // メモリ解放
    greenLower.delete();
    greenUpper.delete();
    anomalyLower.delete();
    anomalyUpper.delete();
    finalMask.delete();
    contours.delete();
  }

  processVideo();
};