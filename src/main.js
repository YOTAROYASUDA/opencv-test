// main.js

// OpenCVが利用可能か最初に確認
if (!window.cv) {
  alert("OpenCV.jsのロードに失敗しました。ページを再読み込みしてください。");
  console.error("cv is not defined");
} else {
  // --- アプリケーションのメイン処理 ---
  const cv = window.cv;
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvasOutput');
  const detectionRateSpan = document.getElementById('detectionRate');
  const statusElement = document.getElementById('status');
  const ctx = canvas.getContext('2d');

  statusElement.textContent = "カメラの準備をしています...";

  const constraints = {
    video: { width: 640, height: 480, facingMode: "environment" }
  };

  // --- メインの処理関数 ---
  async function startApp() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      await video.play();

      statusElement.textContent = "OpenCVを初期化中...";
      initializeCv();

    } catch (err) {
      console.error("カメラのアクセスに失敗しました: ", err);
      statusElement.textContent = "エラー: カメラにアクセスできませんでした。";
      alert("カメラにアクセスできませんでした。");
    }
  }

  function initializeCv() {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    const hsv = new cv.Mat(video.height, video.width, cv.CV_8UC3);
    const mask = new cv.Mat(video.height, video.width, cv.CV_8UC1);
    
    const lowerGreen = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [35, 40, 40, 0]);
    const upperGreen = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [85, 255, 255, 255]);

    statusElement.textContent = "異常検知を実行中...";
    processFrame();

    function processFrame() {
      try {
        ctx.drawImage(video, 0, 0, video.width, video.height);
        src.data.set(ctx.getImageData(0, 0, video.width, video.height).data);

        cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
        cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
        
        // --- ★★★ ここがエラーの修正点 ★★★ ---
        // inRange関数は4つの引数(入力, 範囲下限, 範囲上限, 出力)を取ります。
        cv.inRange(hsv, lowerGreen, upperGreen, mask);
        
        // マスクを反転（緑の部分が黒、それ以外が白に）
        cv.bitwise_not(mask, mask);
        
        // 元画像(src)を一度クリア
        const black = new cv.Scalar(0, 0, 0, 255);
        src.setTo(black);
        
        // 元の映像(video)から、マスク(mask)を使って異常部分だけを抽出
        // videoから直接描画した方が元映像がクリアなため、再度drawImageを使います。
        ctx.drawImage(video, 0, 0, video.width, video.height);
        const originalImage = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        originalImage.data.set(ctx.getImageData(0, 0, video.width, video.height).data);
        originalImage.copyTo(src, mask); // マスクが白い部分だけをコピー
        
        // 異常検知率を計算
        const nonZeroPixels = cv.countNonZero(mask);
        const totalPixels = mask.rows * mask.cols;
        const detectionRate = (nonZeroPixels / totalPixels) * 100;
        detectionRateSpan.textContent = detectionRate.toFixed(2);
        
        // 結果をcanvasに表示
        cv.imshow('canvasOutput', src);

        // 使用したMatを解放
        originalImage.delete();

      } catch (err) {
        console.error("フレーム処理中にエラーが発生:", err);
      }
      
      requestAnimationFrame(processFrame);
    }
  }

  // 実行開始
  startApp();
}