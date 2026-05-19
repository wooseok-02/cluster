import time
from urllib.parse import urlparse

import cloudinary.uploader
from cloudinary.utils import cloudinary_url


AUTHENTICATED_TYPE = "authenticated"
SIGNED_URL_TTL_SECONDS = 3600


def upload_authenticated_photo(file, folder: str) -> dict:
    return cloudinary.uploader.upload(
        file,
        folder=folder,
        type=AUTHENTICATED_TYPE,
    )


def get_signed_photo_url(photo_ref: str | None) -> str | None:
    if not photo_ref:
        return None

    signed_url, _ = cloudinary_url(
        _public_id_from_photo_ref(photo_ref),
        type=AUTHENTICATED_TYPE,
        sign_url=True,
        secure=True,
        expires_at=int(time.time()) + SIGNED_URL_TTL_SECONDS,
    )
    return signed_url


def _public_id_from_photo_ref(photo_ref: str) -> str:
    if not photo_ref.startswith(("http://", "https://")):
        return photo_ref

    path = urlparse(photo_ref).path
    marker = "/upload/"
    if marker not in path:
        return photo_ref

    public_path = path.split(marker, 1)[1]
    parts = public_path.split("/")
    if parts and parts[0].startswith("v") and parts[0][1:].isdigit():
        parts = parts[1:]

    public_id = "/".join(parts).rsplit(".", 1)[0]
    return public_id or photo_ref
