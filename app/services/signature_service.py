import base64
import os
from pathlib import Path

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa


KEY_DIR = Path(os.getenv("KEY_DIR", "app/keys"))
PRIVATE_KEY_PATH = Path(os.getenv("REPORT_PRIVATE_KEY_PATH", str(KEY_DIR / "private_key.pem")))
PUBLIC_KEY_PATH = Path(os.getenv("REPORT_PUBLIC_KEY_PATH", str(KEY_DIR / "public_key.pem")))


def _ensure_key_pair() -> None:
    if PRIVATE_KEY_PATH.exists() and PUBLIC_KEY_PATH.exists():
        return

    KEY_DIR.mkdir(parents=True, exist_ok=True)

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    public_key = private_key.public_key()

    PRIVATE_KEY_PATH.write_bytes(
        private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    PUBLIC_KEY_PATH.write_bytes(
        public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )


def _load_private_key():
    _ensure_key_pair()
    return serialization.load_pem_private_key(PRIVATE_KEY_PATH.read_bytes(), password=None)


def _load_public_key():
    _ensure_key_pair()
    return serialization.load_pem_public_key(PUBLIC_KEY_PATH.read_bytes())


def sign_report_hash(report_hash: str) -> str:
    private_key = _load_private_key()
    signature = private_key.sign(
        report_hash.encode("utf-8"),
        padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
        hashes.SHA256(),
    )
    return base64.b64encode(signature).decode("utf-8")


def verify_report_signature(report_hash: str, signature_b64: str) -> bool:
    try:
        signature = base64.b64decode(signature_b64.encode("utf-8"), validate=True)
        public_key = _load_public_key()
        public_key.verify(
            signature,
            report_hash.encode("utf-8"),
            padding.PSS(mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH),
            hashes.SHA256(),
        )
        return True
    except Exception:
        return False
