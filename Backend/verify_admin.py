"""
Script para verificar y activar el usuario admin si está inactivo.
Ejecuta: python verify_admin.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'confiig.settings')
django.setup()

from apps.users.models import Usuario

def verify_admin():
    print("=== Verificar Usuario Admin ===\n")

    email = input("Email del admin a verificar: ").strip()

    try:
        admin = Usuario.objects.get(email=email)

        print(f"\n📋 Estado actual del usuario:")
        print(f"   Email: {admin.email}")
        print(f"   Nombre: {admin.nombres} {admin.apellidos}")
        print(f"   is_active: {admin.is_active}")
        print(f"   is_staff: {admin.is_staff}")
        print(f"   is_superuser: {admin.is_superuser}")

        if not admin.is_active:
            print(f"\n⚠️  El usuario está inactivo. Activando...")
            admin.is_active = True
            admin.save()
            print(f"✅ Usuario activado correctamente")
        else:
            print(f"\n✅ El usuario ya está activo")

        if not admin.is_staff:
            print(f"\n⚠️  El usuario no es staff. Activando...")
            admin.is_staff = True
            admin.save()
            print(f"✅ Usuario marcado como staff")

        if not admin.is_superuser:
            print(f"\n⚠️  El usuario no es superusuario. Activando...")
            admin.is_superuser = True
            admin.save()
            print(f"✅ Usuario marcado como superusuario")

        print(f"\n🎉 Usuario verificado y listo para usar")

    except Usuario.DoesNotExist:
        print(f"\n❌ No existe un usuario con email: {email}")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    verify_admin()
