import cloudinary
from urllib.parse import urlparse
from config import Settings

parsed = urlparse(Settings.CLOUDINARY_URL)
cloudinary.config(
    cloud_name=parsed.hostname,
    api_key=parsed.username,
    api_secret=parsed.password,
)