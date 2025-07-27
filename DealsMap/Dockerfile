# DealsMap/Dockerfile
FROM python:3.11

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies for GeoDjango
RUN apt-get update && \
    apt-get install -y binutils libproj-dev gdal-bin libgdal-dev && \
    ln -s /usr/lib/x86_64-linux-gnu/libgdal.so /usr/lib/libgdal.so

# Set GDAL environment variables
ENV GDAL_LIBRARY_PATH=/usr/lib/libgdal.so
ENV PROJ_LIB=/usr/share/proj

WORKDIR /code

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

