import cloudinary
import cloudinary.uploader
import io
from urllib.parse import urlparse
from config import settings

parsed = urlparse(settings.CLOUDINARY_URL)
cloudinary.config(
    cloud_name=parsed.hostname,
    api_key=parsed.username,
    api_secret=parsed.password,
)