import os
import uuid
from django.conf import settings


class BlobStorageService:
    """Servicio para manejar Vercel Blob Storage"""
    
    @staticmethod
    def _get_blob_token():
        """Obtiene el token de Vercel Blob Storage desde las variables de entorno"""
        return os.environ.get("BLOB_READ_WRITE_TOKEN")
    
    @staticmethod
    def upload_file(uploaded_file, folder="productos"):
        """
        Sube un archivo a Vercel Blob Storage
        
        Args:
            uploaded_file: Objeto Django UploadedFile
            folder: Carpeta de destino en el blob storage
            
        Returns:
            str: URL pública del archivo subido
        """
        try:
            from vercel import blob
            
            # Generar nombre único
            ext = os.path.splitext(uploaded_file.name)[1].lower() or ".jpg"
            filename = f"{uuid.uuid4().hex}{ext}"
            blob_path = f"{folder}/{filename}"
            
            # Leer contenido del archivo
            file_content = uploaded_file.read()
            
            # Subir a Vercel Blob Storage
            result = blob.put(
                blob_path,
                file_content,
                {
                    "access": "public",
                    "token": BlobStorageService._get_blob_token()
                }
            )
            
            return result.get("url")
            
        except ImportError:
            raise ImportError("La biblioteca 'vercel' no está instalada. Agregue 'vercel' a requirements.txt")
        except Exception as e:
            raise Exception(f"Error al subir archivo a Vercel Blob Storage: {str(e)}")
    
    @staticmethod
    def delete_file(file_url):
        """
        Elimina un archivo de Vercel Blob Storage por su URL
        
        Args:
            file_url: URL del archivo a eliminar
        """
        try:
            from vercel import blob
            
            if not file_url:
                return
                
            # Extraer el path de la URL
            # Vercel Blob URLs tienen formato: https://blob.vercel-storage.com/folder/filename
            if "blob.vercel-storage.com" in file_url:
                # Extraer el path después del dominio
                parts = file_url.split("blob.vercel-storage.com/")
                if len(parts) > 1:
                    blob_path = parts[1]
                    blob.delete(blob_path, {
                        "token": BlobStorageService._get_blob_token()
                    })
                    
        except ImportError:
            raise ImportError("La biblioteca 'vercel' no está instalada. Agregue 'vercel' a requirements.txt")
        except Exception as e:
            # No fallar completamente si la eliminación falla
            print(f"Error al eliminar archivo de Vercel Blob Storage: {str(e)}")
    
    @staticmethod
    def is_blob_url(url):
        """Verifica si una URL es de Vercel Blob Storage"""
        return url and "blob.vercel-storage.com" in url