/* A cancellable camera session. The camera is released on stop, cancel, error or navigation. */
(function () {
  const A = window.Advent;
  A.recordVideo = function ({ preview, onTick, onComplete, onError, onReady }) {
    let recorder, stream, timer, ticker, cancelled = false, finished = false;
    const chunks = [];
    const cleanup = () => {
      clearTimeout(timer); clearInterval(ticker);
      stream?.getTracks().forEach((track) => track.stop());
      preview.srcObject = null;
      window.removeEventListener('pagehide', cancel);
    };
    const fail = () => { if (finished || cancelled) return; finished = true; cleanup(); onError(); };
    const stop = () => { if (recorder?.state === 'recording') recorder.stop(); };
    const cancel = () => { cancelled = true; stop(); cleanup(); };
    window.addEventListener('pagehide', cancel);
    Promise.resolve().then(async () => {
      try {
        if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) throw new Error('Recording unavailable');
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: true });
        if (cancelled) { cleanup(); return; }
        preview.removeAttribute('src');
        preview.controls = false;
        preview.muted = true;
        preview.srcObject = stream;
        await preview.play();
        if (cancelled) { cleanup(); return; }
        const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((type) => MediaRecorder.isTypeSupported(type));
        if (!mimeType) throw new Error('No supported recording format');
        recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1500000, audioBitsPerSecond: 64000 });
        recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder.onerror = fail;
        recorder.onstop = () => {
          cleanup();
          if (cancelled || finished) return;
          finished = true;
          const blob = new Blob(chunks, { type: recorder.mimeType.split(';')[0] });
          if (!blob.size || blob.size > 10 * 1024 * 1024) { onError(); return; }
          onComplete(blob);
        };
        recorder.start();
        const started = performance.now();
        onTick(0);
        timer = setTimeout(stop, 10000);
        ticker = setInterval(() => onTick(Math.min(10, Math.floor((performance.now() - started) / 1000))), 1000);
        onReady();
      } catch { fail(); }
    });
    return { stop, cancel };
  };
})();
