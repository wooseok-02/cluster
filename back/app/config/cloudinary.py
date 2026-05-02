import cloudinary
from urllib.parse import urlparse
from config.config import settings

parsed = urlparse(settings.CLOUDINARY_URL)
cloudinary.config(
    cloud_name=parsed.hostname,
    api_key=parsed.username,
    api_secret=parsed.password,
)