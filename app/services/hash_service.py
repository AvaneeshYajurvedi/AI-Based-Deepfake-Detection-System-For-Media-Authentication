import hashlib


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def compute_file_hash(file_bytes: bytes) -> str:
    return sha256_hex(file_bytes)


def build_report_hash(file_hash: str, result: str, confidence: float, timestamp: str) -> str:
    # Canonicalized payload ensures stable hashing in generation and verification.
    normalized_result = (result or "").strip().upper()
    normalized_confidence = f"{float(confidence):.6f}"
    normalized_timestamp = (timestamp or "").strip()
    payload = f"{file_hash}|{normalized_result}|{normalized_confidence}|{normalized_timestamp}"
    return sha256_hex(payload.encode("utf-8"))
