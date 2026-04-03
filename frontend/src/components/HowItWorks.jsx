export default function HowItWorks() {
  const steps = [
    { n:"01", title:"Upload Media", desc:"Drag and drop an image, audio clip, or video. The system auto-detects the file type and routes it to the correct pipeline." },
    { n:"02", title:"Feature Extraction", desc:"Images: MTCNN face crop. Video: FFmpeg extracts 1 frame/sec (max 60). Audio: librosa resamples to 16kHz mono WAV." },
    { n:"03", title:"Model Inference", desc:"EfficientNet-B4 for image/video. Wav2Vec2 for audio deepfake detection. Whisper for transcription. XLM-RoBERTa for sentiment." },
    { n:"04", title:"GradCAM Heatmap", desc:"Grad-CAM highlights the most suspicious regions in the most anomalous frame, showing exactly what the model flagged." },
    { n:"05", title:"Narrative Analysis", desc:"The transcript is scanned for sentiment polarity, sensitive topic keywords, and manipulative language patterns." },
    { n:"06", title:"Report Generated", desc:"A structured forensic report with verdict, confidence, manipulation risk score, flagged phrases, and topic tags is returned." },
  ];

  return (
    <div className="how-page">
      <div className="how-hero">
        <h1 className="how-title">How DeepShield Works</h1>
        <p className="how-sub">Multi-modal AI pipeline for detecting synthetic and manipulated media</p>
      </div>

      <div className="panel how-steps-panel" style={{ marginBottom: 18 }}>
        <div className="panel-head"><span className="panel-title">Steps</span></div>
        <div className="how-steps">
          {steps.map((s, i) => (
            <div key={s.n} className="how-step">
              <div className="how-step-num">{s.n}</div>
              <div className="how-step-content">
                <div className="how-step-title">{s.title}</div>
                <div className="how-step-desc">{s.desc}</div>
              </div>
              {i < steps.length - 1 && <div className="how-step-arrow">→</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
