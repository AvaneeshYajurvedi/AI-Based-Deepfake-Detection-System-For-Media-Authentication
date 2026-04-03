import ForensicDashboard from "./forensics/ForensicDashboard";

export default function ResultPanel({ result, mediaType, filename, status, file, onPdfSessionTimeout }) {
  return (
    <ForensicDashboard
      result={result}
      mediaType={mediaType}
      filename={filename}
      status={status}
      file={file}
      onPdfSessionTimeout={onPdfSessionTimeout}
    />
  );
}
